import { NextFunction, Response } from "express";
import { EntityTarget, ObjectLiteral } from "typeorm";
import { AccountHistory } from "../entities";
import { appDataSource } from "../orm.config";
import { APIResponse } from "../types";
import { ApiError, ErrorHandler, isDateValid, requestHandler } from "../utils";

export class ReportController {
  getCashFlow = requestHandler(
    async (req, res, next) => {
      try {
        const qb = this.getRepository(AccountHistory)
          .createQueryBuilder("ah")
          .leftJoinAndSelect("ah.account", "a")
          .leftJoinAndSelect("ah.customer", "c");

        if (req.query.startDate && req.query.endDate) {
          const isValid = isDateValid(req.query.startDate, req.query.endDate);

          if (!isValid) {
            throw new ErrorHandler("Invalid Date", 404);
          }
          qb.andWhere("DATE(ah.createdAt) BETWEEN :startDate AND :endDate", {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
          });
        }

        const cashFlow = await qb.orderBy("ah.createdAt", "DESC").getMany();

        this.success(res, cashFlow);
      } catch (err) {
        return this.failed(err, next);
      }
    },
    {
      query: {
        startDate: "",
        endDate: "",
      },
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
