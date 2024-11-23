import { Router } from "express";
import { ProductController } from "../controller";

export const productRoutes = Router();

const { create, get, getProductDetails, getVolatileProducts } =
  new ProductController();
productRoutes.route("/").post(create).get(get);
productRoutes.get("/volatile-product", getVolatileProducts);
productRoutes.get("/:id", getProductDetails);
