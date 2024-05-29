import {
  Contacts,
  Product,
  ProductType,
  Purchase,
  PurchaseStatus,
} from "../entities";
import { PaymentOption, PaymentStatus } from "../entities/paymentoption";
import { PurchasedCart } from "../entities/purchased.cart";
import { ApiError, generateRandomNumber, requestHandler } from "../utils";
import { Controller } from "./base";
import { ProductController } from "./product";

interface ProductInfo {
  product_id: string;
  codes: string[];
  quantity: number;
  purchase_price: string;
  product_type: string;
}

type PurchaseProduct = Product & {
  purchase_qty: number;
};

export class PurchaseController extends Controller<Purchase> {
  constructor() {
    super(Purchase);
  }
  createPurchaseWithBarcode = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(
          req.body,
          "contact_id",
          "status",
          "products",
          "product_type",
          "amount",
          "quantity"
        );
        this.isValidEnum(PurchaseStatus, req.body.status);

        if (!req.user) {
          throw new Error("Unauthorized access");
        }

        const { products: productsInfo } = req.body as {
          products: ProductInfo[];
        };

        const amount = Number(req.body.amount) ? Number(req.body.amount) : 0;
        const paid_amount = Number(req.body.paid_amount)
          ? Number(req.body.paid_amount)
          : 0;
        const discount = Number(req.body.discount)
          ? Number(req.body.discount)
          : 0;
        const transport_cost = Number(req.body.transport_cost)
          ? Number(req.body.transport_cost)
          : 0;
        const amountAfterDiscount = amount - discount;
        const due_amount = amountAfterDiscount - paid_amount;
        const contactData = await this.getRepository(Contacts)
          .createQueryBuilder()
          .where("id=:contactId", { contactId: req.body.contact_id })
          .getOneOrFail();
        // Creating Payment for purchase
        const payment = this.createPayment(contactData, paid_amount, amount);
        if (payment.payment_status === PaymentStatus.DUE) {
          contactData.due_from_owner += due_amount > 0 ? due_amount : 0;

          if (contactData.due_from_supplier > 0) {
            contactData.due_from_supplier -= due_amount > 0 ? due_amount : 0;
          }
        }

        // New Purchase record
        const purchase = new Purchase();
        purchase.payment = payment;
        purchase.business = req.user.business;
        purchase.status = req.body.status;
        purchase.amount = amountAfterDiscount;
        purchase.contact = contactData;
        purchase.quantity = Number(req.body.quantity);
        purchase.paid_amount = paid_amount;
        purchase.discount = discount;
        purchase.transport_cost = transport_cost;
        purchase.due = due_amount > 0 ? due_amount : 0;
        const products: PurchaseProduct[] = [];
        // Updating / creating new products in database
        for (const p of productsInfo) {
          const productData = await ProductController.getProductById(
            p.product_id
          );
          if (productData.product_type === ProductType.BARCODE) {
            await this.handleBarcodeProducts(productData, products, p);
          } else {
            await this.handleNonBarcodeProducts(productData, products, p);
          }
        }
        products.forEach(({ purchase_qty, ...p }) => {
          purchase.addProduct(p as Product);
          const cartExist = purchase.purchasedCart?.findIndex(
            (pc) => pc.name === p.name
          );
          if (!!purchase?.purchasedCart?.length && cartExist !== -1) {
            purchase.purchasedCart[cartExist].quantity += purchase_qty;
            purchase.purchasedCart[cartExist].sku_id += `, ${p.sku_id}`;
          } else {
            console.log("Running THis Portions");

            const cart = new PurchasedCart();
            Object.assign<any, Partial<PurchasedCart>>(cart, {
              name: p.name,
              quantity: purchase_qty,
              product_type: p.product_type,
              selling_price: p.selling_price,
              purchase_price: p.purchase_price,
              sku_id: p.sku_id,
            });
            purchase.addCart(cart);
          }
        });
        await this.repository.save(purchase);
        this.success(res, purchase, 201);
      } catch (error) {
        return ApiError(error, 404, next);
      }
    },
    { body: {} as any }
  );

  // Creaing payment for purchase
  private createPayment(
    contact: Contacts,
    paid_amount: number,
    amount: number
  ): PaymentOption {
    const payment = new PaymentOption();
    payment.type = "Purchase";
    payment.reciver_id = contact.id;
    payment.amount = paid_amount;
    payment.recived_by = "Supplier";
    payment.contact = contact;
    payment.payment_status =
      paid_amount < amount ? PaymentStatus.DUE : PaymentStatus.PAID;

    return payment;
  }

  // Handling Barcode Products
  private async handleBarcodeProducts(
    productData: Product,
    products: PurchaseProduct[],
    p: ProductInfo
  ) {
    if (!productData.sku_id) {
      productData.sku_id = p.codes[0];
      productData.quantity = 1;
      productData.purchase_price = Number.parseInt(p.purchase_price);
      productData.product_type = ProductType.BARCODE;
      await this.saveBarcodes(
        productData,
        p.codes.slice(1),
        Number.parseInt(p.purchase_price),
        products
      );
    } else {
      await this.saveBarcodes(
        productData,
        p.codes,
        Number.parseInt(p.purchase_price),
        products
      );
    }
  }

  // Handling Non Barcode Products
  private async handleNonBarcodeProducts(
    productData: Product,
    products: PurchaseProduct[],
    p: ProductInfo
  ) {
    productData.sku_id = productData.sku_id
      ? productData.sku_id
      : generateRandomNumber(12).toString();
    productData.purchase_price = Number.parseInt(p.purchase_price);
    productData.quantity += p.quantity;
    products.push({
      ...productData,
      purchase_qty: p.quantity,
    } as PurchaseProduct);
  }

  // Saving Barcodes products
  private async saveBarcodes(
    { id, ...productData }: Product,
    codes: string[],
    purchasePrice: number,
    products: PurchaseProduct[]
  ) {
    for (const code of codes) {
      const existingProduct = await this.getRepository(Product).findOne({
        where: { sku_id: code },
      });
      if (existingProduct) {
        throw new Error(`SKU code ${code} already exists`);
      }

      const newProduct = new Product();
      Object.assign(newProduct, {
        ...productData,
        sku_id: code,
        purchase_qty: 1,
      });
      newProduct.purchase_price = purchasePrice;
      newProduct.selling_price = productData.selling_price;
      newProduct.quantity = 1;
      newProduct.product_type = ProductType.BARCODE;

      products.push(newProduct as PurchaseProduct);
    }

    return products;
  }

  // Get all purchases
  getPurchase = requestHandler(async (req, res, next) => {
    try {
      const data = await this.repository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.business", "b")
        .leftJoinAndSelect("p.products", "products")
        .leftJoinAndSelect("p.contact", "c")
        .leftJoinAndSelect("p.purchasedCart", "pc")
        .where("b.id = :id", { id: req.user?.business.id })
        .orderBy("p.created_at", "DESC")
        .getMany();

      this.success(res, data);
    } catch (error) {
      return ApiError(error, 404, next);
    }
  });

  // Return Previous purchase

  returnPurchase = requestHandler(
    async (req, res, next) => {
      try {
        const purchase = await this.getRepository(Purchase).findOneOrFail({
          where: { id: req.params.id },
          relations: {
            products: true,
          },
        });
        purchase.status = PurchaseStatus.RETURNED;
        purchase.products.forEach((p) => {
          p.is_returned = true;
        });
        purchase.returned_at = new Date(Date.now()).toISOString();
        await this.getRepository(Purchase).save(purchase);
        this.success(res, purchase);
      } catch (error) {
        return ApiError(error, 404, next);
      }
    },
    {
      params: {} as { id: number },
    }
  );
}
