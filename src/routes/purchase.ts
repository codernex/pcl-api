import { Router } from "express";
import { PurchaseController } from "../controller";

export const purchaseRoutes = Router();
const {
  createPurchaseWithBarcode,
  getPurchase,
  returnPurchase,
} = new PurchaseController();
purchaseRoutes.route("/").get(getPurchase);
purchaseRoutes.post("/barcode", createPurchaseWithBarcode);
purchaseRoutes.patch("/return/:id", returnPurchase);
