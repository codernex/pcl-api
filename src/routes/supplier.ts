import { Router } from "express";
import { SupplierController } from "../controller";

export const supplierRoutes = Router();
const { createSupplier, getSupplier } = new SupplierController();

supplierRoutes.route("/").get(getSupplier).post(createSupplier);
