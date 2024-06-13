import { Router } from "express";
import { PurchaseController } from "../controller";
import { upload } from "../utils";

export const purchaseRoutes = Router();
const { createPurchaseWithBarcode, getPurchase, returnPurchase } =
  new PurchaseController();
purchaseRoutes.route("/").get(getPurchase);
purchaseRoutes.post(
  "/barcode",
  upload.single("image"),
  createPurchaseWithBarcode
);
purchaseRoutes.patch("/return/:id", returnPurchase);
