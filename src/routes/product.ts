import { Router } from "express";
import { ProductController } from "../controller";

export const productRoutes = Router();

const { create, get } = new ProductController();
productRoutes.route("/").post(create).get(get);
