import { Router } from "express";
import { ErrorHandler, isDateValid, requestHandler } from "../utils";
import { appDataSource } from "../orm.config";
import { SavingDeposit } from "../entities";

export const depositRoutes = Router();

depositRoutes.get(
  "/",
  requestHandler(
    async (req, res, next) => {
      try {
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

        const data = await qb.orderBy("s.created_at", "DESC").getMany();
        res.status(200).json({
          data,
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
