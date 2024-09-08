import { Router } from "express";
import { PaymentController } from "../controller";

export const paymentRoutes = Router();

const { get } = new PaymentController();
paymentRoutes.route("/").get(get);
