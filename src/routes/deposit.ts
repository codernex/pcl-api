import { Router } from "express";
import { encodeCursor, ErrorHandler, isDateValid, parseCursorParams, requestHandler } from "../utils";
import { appDataSource } from "../orm.config";
import { SavingDeposit } from "../entities";

export const depositRoutes = Router();

depositRoutes.get(
  "/",
  requestHandler(
    async (req, res, next) => {
      try {
        const { cursor, limit } = parseCursorParams(req.query);
        const qb = appDataSource
          .getRepository(SavingDeposit)
          .createQueryBuilder("s")
          .leftJoinAndSelect("s.customer", "c");

        if (req.query.startDate && req.query.endDate) {
          const isDate = isDateValid(req.query.startDate, req.query.endDate);
          if (!isDate) {
            throw new ErrorHandler("Invalid Date", 404);
          }
          qb.andWhere("DATE(s.created_at) BETWEEN :startDate AND :endDate", {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
          });
        }

        const totalCount = await qb.getCount();

        if (cursor) {
          qb.andWhere("s.id < :cursor", { cursor });
        }

        const items = await qb
          .orderBy("s.id", "DESC")
          .take(limit + 1)
          .getMany();

        const hasMore = items.length > limit;
        if (hasMore) items.pop();
        const nextCursor =
          hasMore && items.length > 0
            ? encodeCursor(items[items.length - 1].id)
            : null;

        res.status(200).json({
          data: items,
          pagination: {
            nextCursor,
            hasMore,
            totalCount,
          },
          status: 200,
          success: true,
        });
      } catch (error) {
        next(error);
      }
    },
    {
      query: {} as any,
    }
  )
);
