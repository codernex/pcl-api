import { Router } from "express";
import { Between, In } from "typeorm";
import { PaymentOption } from "../entities";
import { appDataSource } from "../orm.config";
import { ErrorHandler, isDateValid, requestHandler } from "../utils";

export const installmentRoutes = Router();

installmentRoutes.get(
  "/",
  requestHandler(
    async (req, res, next) => {
      try {
        const qb = appDataSource
          .getRepository(PaymentOption)
          .createQueryBuilder("p")
          .leftJoinAndSelect("p.contact", "contact")
          .andWhere("p.type IN('COLLECT_INSTALLMENT','COLLECT_LPR')");

        if (req.query.startDate && req.query.endDate) {
          const isDate = isDateValid(req.query.startDate, req.query.endDate);
          if (!isDate) {
            throw new ErrorHandler("Invalid Date", 404);
          }
          qb.andWhere("DATE(p.created_at) BETWEEN :startDate AND :endDate", {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
          });
        }

        const installments = await qb.orderBy("p.created_at", "DESC").getMany();

        res.status(200).json({
          status: 200,
          success: true,
          data: installments,
        });
      } catch (error) {
        next(error);
      }
    },
    { query: {} as any }
  )
);
