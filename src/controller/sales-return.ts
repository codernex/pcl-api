import { In } from "typeorm";
import { Product, SalesReturn, TransactionType } from "../entities";
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
            id: In(req.body.products.map((p) => p.id)),
          },
        });

        if (!products.length) {
          return this.failed("Product not found", next);
        }

        for (const product of products) {
          const bodyProduct = req.body.products.find(
            (p) => p.id === product.id
          );
          if (!bodyProduct) {
            return this.failed("Product not found", next);
          }
          product.is_returned = true;
          product.quantity += bodyProduct?.quantity;
          salesReturn.addProduct(product);
          salesReturn.amount += parseInt(bodyProduct?.return_amount);
        }

        await AccountController.updateBalance(
          salesReturn.amount,
          TransactionType.CREDIT,
          "SALES_RETURN",
          "Sales Return amount to customer"
        );

        await this.repository.save(salesReturn);

        this.success(res, salesReturn);
      } catch (error) {
        return this.failed(error, next);
      }
    },
    {
      body: {
        products: [],
      } as {
        products: {
          id: string;
          quantity: number;
          return_amount: string;
        }[];
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
