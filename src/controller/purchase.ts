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
          throw new Error("Unatuthorized access");
        }

        const { product, product_type } = req.body as {
          product: { product_id: string; codes: string[] };
          product_type: ProductType;
        };

        const products: Product[] = [];
        const productData = await ProductController.getProductById(
          product.product_id
        );
        products.push(productData);

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
        purchase.payment = payment;
        purchase.business = req.user.business;
        purchase.status = req.body.status;
        purchase.amount = req.body.purchase_price * product.codes.length;
        purchase.contact = contactData;
        purchase.quantity = product.codes?.length;
        productData.sku_id = product.codes[0];
        productData.quantity = 1;
        productData.quantity = 1;
        productData.purchase_price = req.body.purchase_Price;
        productData.product_type = product_type as ProductType;
        const barCodes = product.codes.slice(1);
        if (barCodes.length > 0) {
          for (const code of barCodes) {
            const newProduct = new Product();
            const { id, ...data } = productData;

            Object.assign(newProduct, {
              ...data,
              sku_id: code,
            });
            newProduct.purchase_price = req.body.purchase_price;
            newProduct.selling_price = productData.selling_price;
            newProduct.quantity = 1;
            newProduct.product_type = ProductType.BARCODE;
            purchase.addProduct(newProduct);
            await this.getRepository(Product).save(newProduct);
            products.push(newProduct);
          }
        }
        products.forEach((p) => {
          purchase.addProduct(p);
        });
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

  getPurchase = requestHandler(async (req, res, next) => {
    try {
      const data = await this.repository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.business", "b")
        .leftJoinAndSelect("p.products", "products")
        .leftJoinAndSelect("p.contact", "c")
        .where("b.id = :id", { id: req.user?.business.id })
        .getMany();

      this.success(res, data);
    } catch (error) {
      return ApiError(error, 404, next);
    }
  });
}
