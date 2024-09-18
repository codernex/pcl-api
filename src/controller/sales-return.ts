import { In } from "typeorm";
import {
  Cart,
  Invoice,
  Product,
  SalesReturn,
  TransactionType,
} from "../entities";
import { requestHandler } from "../utils";
import { Controller } from "./base";
import { AccountController } from "./account";

export class SalesReturnController extends Controller<SalesReturn> {
  constructor() {
    super(SalesReturn);
  }

  createSalesReturn = requestHandler(
    async (req, res, next) => {
      try {
        const salesReturn = new SalesReturn();

        const products = await this.getRepository(Product).find({
          where: {
            sku_id: In(req.body.products.map((p) => p.sku_id)),
          },
        });

        const invoice = await this.getRepository(Invoice).findOne({
          where: {
            id: req.body.invoiceId,
          },
          relations: {
            contact: true,
          },
        });

        if (!invoice) {
          return this.failed("Invoice not found", next);
        }

        if (!products.length) {
          return this.failed("Product not found", next);
        }

        for (const product of products) {
          const bodyProduct = req.body.products.find(
            (p) => p.sku_id === product.sku_id
          );

          const salesCart = await this.getRepository(Cart).findOne({
            where: {
              invoice: {
                id: invoice.id,
              },
            },
          });

          if (!salesCart) {
            return this.failed("Product not found", next);
          }
          if (salesCart.isReturned) {
            return this.failed("Product already returned", next);
          }
          if (!bodyProduct) {
            return this.failed("Product not found", next);
          }
          if (bodyProduct.return_qty > salesCart.quantity) {
            return this.failed("Quantity not available to return", next);
          }
          product.is_returned = true;
          product.quantity += bodyProduct?.return_qty;
          salesReturn.addProduct(product);
          salesCart.isReturned = true;
          await this.getRepository(Cart).save(salesCart);
        }
        salesReturn.amount = req.body.returnAmount;
        salesReturn.invoice = invoice;
        await AccountController.updateBalance(
          salesReturn.amount,
          TransactionType.CREDIT,
          "SALES_RETURN",
          "Sales Return amount to customer",
          invoice.contact
        );

        salesReturn.customer = invoice.contact;
        await this.repository.save(salesReturn);

        this.success(res, salesReturn);
      } catch (error) {
        return this.failed(error, next);
      }
    },
    {
      body: {
        products: [],
        invoiceId: 0,
        returnAmount: 0,
      } as {
        products: {
          sku_id: string;
          quantity: number;
          return_qty: number;
        }[];
        invoiceId: number;
        returnAmount: number;
      },
    }
  );

  getSalesReturn = requestHandler(async (req, res, next) => {
    try {
      const salesReturn = await this.getRepository(SalesReturn).find();
      this.success(res, salesReturn);
    } catch (error) {
      return this.failed(error, next);
    }
  });
}
