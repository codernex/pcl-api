import {
  Contacts,
  Product,
  ProductType,
  Purchase,
  PurchaseStatus,
} from "../entities";
import { PaymentOption } from "../entities/paymentoption";
import { ApiError, generateRandomNumber, requestHandler } from "../utils";
import { Controller } from "./base";
import { ProductController } from "./product";

export class PurchaseController extends Controller<Purchase> {
  constructor() {
    super(Purchase);
  }

  createPurchaseWithoutBarcode = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(
          req.body,
          "contact_id",
          "purchase_price",
          "status",
          "product",
          "product_type",
          "quantity"
        );
        this.isValidEnum(PurchaseStatus, req.body.status);

        if (!req.user) {
          throw new Error("Unatuthorized access");
        }

        const { product, product_type } = req.body as {
          product: { product_id: string; codes: string[] };
          product_type: ProductType;
        };

        const productData = await ProductController.getProductById(
          product.product_id
        );

        const contactData = await this.getRepository(Contacts)
          .createQueryBuilder()
          .where("id=:contactId", { contactId: req.body.contact_id })
          .getOneOrFail();
        const payment = new PaymentOption();
        payment.type = "Purchase";
        payment.reciver_id = contactData.id;
        payment.amount = req.body.purchase_price * req.body.quantity;
        payment.recived_by = "Supplier";
        payment.contact = contactData;
        const purchase = new Purchase();
        purchase.business = req.user.business;
        purchase.amount = req.body.purchase_price * req.body.quantity;
        purchase.contact = contactData;
        productData.sku_id = generateRandomNumber(12).toString();
        productData.product_type = product_type as ProductType;
        purchase.status = req.body.status;
        purchase.quantity = req.body.quantity;
        productData.purchase_price = Number.parseFloat(req.body.purchase_price);
        productData.quantity += req.body.quantity;
        purchase.payment = payment;
        purchase.addProduct(productData);
        await this.getRepository(Product).save(productData);
        await this.repository.save(purchase);
        this.success(res, purchase, 201);
      } catch (error) {
        return ApiError(error, 404, next);
      }
    },
    {
      body: {} as any,
    }
  );
  createPurchaseWithBarcode = requestHandler(
    async (req, res, next) => {
      try {
        this.validateErr(
          req.body,
          "contact_id",
          "purchase_price",
          "status",
          "product",
          "product_type"
        );
        this.isValidEnum(PurchaseStatus, req.body.status);

        if (!req.user) {
          throw new Error("Unauthorized access");
        }

        const { product, product_type } = req.body as {
          product: { product_id: string; codes: string[] };
          product_type: ProductType;
        };

        const productData = await ProductController.getProductById(
          product.product_id
        );
        const contactData = await this.getRepository(Contacts)
          .createQueryBuilder()
          .where("id=:contactId", { contactId: req.body.contact_id })
          .getOneOrFail();

        const products: Product[] = [];
        const payment = new PaymentOption();
        payment.type = "Purchase";
        payment.reciver_id = contactData.id;
        payment.amount = req.body.purchase_price * req.body.quantity;
        payment.recived_by = "Supplier";
        payment.contact = contactData;

        const purchase = new Purchase();
        purchase.payment = payment;
        purchase.business = req.user.business;
        purchase.status = req.body.status;
        purchase.amount = req.body.purchase_price * product.codes.length;
        purchase.contact = contactData;
        purchase.quantity = product.codes?.length;

        if (!productData.sku_id) {
          productData.sku_id = product.codes[0];
          productData.quantity = 1;
          productData.purchase_price = req.body.purchase_price;
          productData.product_type = ProductType.BARCODE;
          await this.saveBarcodes(
            productData,
            product.codes.slice(1),
            req.body.purchase_price,
            products
          );
        } else {
          await this.saveBarcodes(
            productData,
            product.codes,
            req.body.purchase_price,
            products
          );
        }
        await this.getRepository(Product).save(productData);
        products.forEach((p) => purchase.addProduct(p));
        await this.repository.save(purchase);
        this.success(res, purchase, 201);
      } catch (error) {
        return ApiError(error, 404, next);
      }
    },
    { body: {} as any }
  );

  private async saveBarcodes(
    productData: Product,
    codes: string[],
    purchasePrice: number,
    products: Product[]
  ) {
    for (const code of codes) {
      const existingProduct = await this.getRepository(Product).findOne({
        where: { sku_id: code },
      });
      if (existingProduct) {
        throw new Error(`SKU code ${code} already exists`);
      }

      const newProduct = new Product();
      Object.assign(newProduct, { ...productData, sku_id: code });
      newProduct.purchase_price = purchasePrice;
      newProduct.selling_price = productData.selling_price;
      newProduct.quantity = 1;
      newProduct.product_type = ProductType.BARCODE;
      await this.getRepository(Product).save(newProduct);
      products.push(newProduct);
    }

    return products;
  }

  getPurchase = requestHandler(async (req, res, next) => {
    try {
      const data = await this.repository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.business", "b")
        .leftJoinAndSelect("p.products", "products")
        .leftJoinAndSelect("p.contact", "c")
        .where("b.id = :id", { id: req.user?.business.id })
        .orderBy("p.created_at", "DESC")
        .getMany();

      this.success(res, data);
    } catch (error) {
      return ApiError(error, 404, next);
    }
  });

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
