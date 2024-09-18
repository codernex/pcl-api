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
        .select([
          "customer.id",
          "customer.name",
          "customer.cash_due",
          "customer.account_number",
          "customer.mobile",
        ])
        .andWhere("customer.cash_due > 0");

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
