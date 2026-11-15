import { NextFunction, Response } from "express";
import { EntityTarget, ObjectLiteral } from "typeorm";
import { AccountHistory } from "../entities";
import { appDataSource } from "../orm.config";
import { APIResponse } from "../types";
import { ApiError, CursorPaginatedResult, encodeCursor, ErrorHandler, isDateValid, parseCursorParams, requestHandler } from "../utils";

export class ReportController {
  getCashFlow = requestHandler(
    async (req, res, next) => {
      try {
        const { cursor, limit } = parseCursorParams(req.query);

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

        const totalCount = await qb.getCount();

        if (cursor) {
          qb.andWhere("ah.id < :cursor", { cursor });
        }

        const items = await qb
          .orderBy("ah.id", "DESC")
          .take(limit + 1)
          .getMany();

        const hasMore = items.length > limit;
        if (hasMore) items.pop();
        const nextCursor =
          hasMore && items.length > 0
            ? encodeCursor(items[items.length - 1].id)
            : null;

        this.successPaginated(res, {
          items,
          nextCursor,
          hasMore,
          totalCount,
        });
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

  protected successPaginated = <T>(
    res: Response<APIResponse>,
    result: CursorPaginatedResult<T>,
    status = 200
  ) => {
    res.status(status).json({
      status,
      success: true,
      data: result.items,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        totalCount: result.totalCount,
      },
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
