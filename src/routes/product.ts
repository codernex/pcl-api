import { Router } from "express";
import { ProductController } from "../controller";

export const productRoutes = Router();

const { create, get, updateProduct } = new ProductController();
productRoutes.route("/").post(create).get(get);
productRoutes.route("/:id").patch(updateProduct);
