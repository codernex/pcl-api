import { Router } from "express";
import { SupplierController } from "../controller";

export const supplierRoutes = Router();
const { createSupplier, getSupplier, payDue } = new SupplierController();

supplierRoutes.route("/").get(getSupplier).post(createSupplier);

supplierRoutes.patch("/:id/pay-due", payDue);
