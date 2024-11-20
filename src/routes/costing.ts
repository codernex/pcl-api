import { Router } from "express";
import { CostingController } from "../controller";

export const costingRoutes = Router();

const { create, get } = new CostingController();

costingRoutes.route("/").get(get).post(create);
