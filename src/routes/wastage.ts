import { Router } from "express";
import { WastageController } from "../controller";

export const wastageRoutes = Router();

const { create, get } = new WastageController();

wastageRoutes.route("/").get(get).post(create);
