import { Router } from "express";
import { In } from "typeorm";
import { PaymentOption } from "../entities";
import { appDataSource } from "../orm.config";
import { ErrorHandler, requestHandler } from "../utils";

export const installmentRoutes = Router();

installmentRoutes.get(
  "/",
  requestHandler(async (req, res, next) => {
    try {
      const installments = await appDataSource
        .getRepository(PaymentOption)
        .find({
          relations: {
            contact: true,
          },
          where: {
            type: In(["COLLECT_INSTALLMENT", "COLLECT_LPR"]),
          },
          order: {
            created_at: "DESC",
          },
        });

      res.status(200).json({
        status: 200,
        success: true,
        data: installments,
      });
    } catch (error) {
      throw new ErrorHandler("Installment not found", 404);
    }
  })
);
