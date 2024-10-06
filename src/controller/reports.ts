import { NextFunction, Response } from "express";
import { EntityTarget, ObjectLiteral } from "typeorm";
import { Customer, Product } from "../entities";
import { appDataSource } from "../orm.config";
import { APIResponse } from "../types";
import { ApiError, requestHandler } from "../utils";

export class ReportController {
  getRetailDueList = requestHandler(async (req, res, next) => {
    try {
      const qb = this.getRepository(Customer)
        .createQueryBuilder("customer")
        .leftJoinAndSelect("customer.invoices", "invoices")
        .select([
          "customer.id",
          "customer.name",
          "customer.cash_due",
          "customer.mobile",
          "customer.present_address",
          "customer.permanent_address",
          "invoices.invoice_id",
        ])
        .andWhere("customer.cash_due > 0")
        .andWhere("invoices.sales_type = 'RETAIL'");

      const data = await qb.orderBy("customer.id", "DESC").getMany();
      return this.success(res, data);
    } catch (error) {
      return this.failed(error, next);
    }
  });

  getHireDueList = requestHandler(async (req, res, next) => {
    try {
      const qb = this.getRepository(Customer)
        .createQueryBuilder("customer")
        .leftJoinAndSelect("customer.invoices", "invoices")
        .leftJoinAndSelect("customer.payment_option", "payments")
        .leftJoinAndSelect("customer.installments", "installments")
        .andWhere("customer.hire_due > 0")
        .andWhere("customer.approved = true")
        .andWhere("customer.is_hire_account_closed = false")
        .andWhere("customer.savingsCustomer = false")
        .andWhere("customer.seasonal_approved = false")
        .andWhere("invoices.sales_type != 'RETAIL'");
      const data = await qb.orderBy("customer.id", "DESC").getMany();
      return this.success(res, data);
    } catch (error) {
      return this.failed(error, next);
    }
  });

  getSavingsHireDueList = requestHandler(async (req, res, next) => {
    try {
      const qb = this.getRepository(Customer)
        .createQueryBuilder("customer")
        .leftJoinAndSelect("customer.invoices", "invoices")
        .leftJoinAndSelect("customer.payment_option", "payments")
        .leftJoinAndSelect("customer.installments", "installments")
        .andWhere("customer.hire_due > 0")
        .andWhere("customer.is_hire_account_closed = false")
        .andWhere("customer.savingsCustomer = true")
        .andWhere("customer.seasonal_approved = false")
        .andWhere("customer.approved = false")
        .andWhere("invoices.sales_type != 'RETAIL'");
      const data = await qb.orderBy("customer.id", "DESC").getMany();
      return this.success(res, data);
    } catch (error) {
      return this.failed(error, next);
    }
  });

  getSeasonalHireDueList = requestHandler(async (req, res, next) => {
    try {
      const qb = this.getRepository(Customer)
        .createQueryBuilder("customer")
        .leftJoinAndSelect("customer.invoices", "invoices")
        .leftJoinAndSelect("customer.payment_option", "payments")
        .leftJoinAndSelect("customer.seasonal", "seasonal")
        .andWhere("customer.hire_due > 0")
        .andWhere("customer.is_hire_account_closed = false")
        .andWhere("customer.savingsCustomer = false")
        .andWhere("customer.seasonal_approved = true")
        .andWhere("customer.approved = false")
        .andWhere("invoices.sales_type != 'RETAIL'");
      const data = await qb.orderBy("customer.id", "DESC").getMany();
      return this.success(res, data);
    } catch (error) {
      return this.failed(error, next);
    }
  });

  getStockReport = requestHandler(
    async (req, res, next) => {
      try {
        const qb = this.getRepository(Product)
          .createQueryBuilder("p")
          .leftJoinAndSelect("p.model", "m")
          .leftJoinAndSelect("p.brand", "b")
          .leftJoinAndSelect("p.category", "c");

        if (req.query.model) {
          qb.andWhere("m.name = :model", { model: req.query.model });
        }

        const productData = await qb.getMany();
        const groupedProduct = new Map<string, Product>();

        productData.forEach((product) => {
          const key =
            product.name +
            "_" +
            product.category.name +
            "_" +
            product.brand.name +
            "_" +
            product.model.name;

          const existingProduct = groupedProduct.get(key);

          if (existingProduct) {
            existingProduct.quantity += product.quantity;
            existingProduct.sku_id =
              existingProduct.sku_id + "," + product.sku_id;
            groupedProduct.set(key, existingProduct);
          } else {
            groupedProduct.set(key, product);
          }
        });
        return this.success(res, Array.from(groupedProduct.values()));
      } catch (error) {
        return this.failed(error, next);
      }
    },
    {
      query: {} as any,
    }
  );

  /**
   * Controller Specific Database Methods
   */
  protected getRepository = <U extends ObjectLiteral>(
    Entity: EntityTarget<U>
  ) => appDataSource.getRepository(Entity);

  protected success = <T>(
    res: Response<APIResponse>,
    data?: T,
    status = 200,
    message?: string
  ) => {
    res.status(status).json({
      status,
      success: true,
      message,
      data,
    });
  };

  protected failed = (
    err: any,
    next: NextFunction,
    statusCode: number = 404
  ) => {
    ApiError(err, statusCode, next);
  };
}
