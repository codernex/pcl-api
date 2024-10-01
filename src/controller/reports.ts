import { NextFunction, Response } from "express";
import { EntityTarget, ObjectLiteral } from "typeorm";
import { Customer } from "../entities";
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
        .select([
          "customer.id",
          "customer.name",
          "customer.hire_due",
          "customer.mobile",
          "customer.account_number",
          "customer.present_address",
          "customer.permanent_address",
          "invoices.invoice_id",
        ])
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
        .select([
          "customer.id",
          "customer.name",
          "customer.hire_due",
          "customer.mobile",
          "customer.account_number",
          "customer.present_address",
          "customer.permanent_address",
          "invoices.invoice_id",
        ])
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
        .select([
          "customer.id",
          "customer.name",
          "customer.hire_due",
          "customer.mobile",
          "customer.account_number",
          "customer.present_address",
          "customer.permanent_address",
          "invoices.invoice_id",
        ])
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
