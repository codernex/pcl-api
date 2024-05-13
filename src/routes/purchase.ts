import { Router } from "express";
import { PurchaseController } from "../controller";

export const purchaseRoutes = Router();
const { createPurchaseWithBarcode, getPurchase, createPurchaseWithoutBarcode } =
  new PurchaseController();
purchaseRoutes.route("/").get(getPurchase);
purchaseRoutes.post("/barcode", createPurchaseWithBarcode);
purchaseRoutes.post("/no-barcode", createPurchaseWithoutBarcode);
