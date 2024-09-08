import { Router } from "express";
import { SalesReturnController } from "../controller";

export const salesReturnRoutes = Router();

const { createSalesReturn, getSalesReturn } = new SalesReturnController();
salesReturnRoutes.route("/").get(getSalesReturn).post(createSalesReturn);
