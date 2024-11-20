import { Router } from "express";
import { ProductController } from "../controller";

export const productRoutes = Router();

const { create, get, getProductDetails } = new ProductController();
productRoutes.route("/").post(create).get(get);
productRoutes.get("/:id", getProductDetails);
