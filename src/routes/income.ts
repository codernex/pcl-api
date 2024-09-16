import { Router } from "express";
import { IncomeController } from "../controller";

export const incomeRoutes = Router();
const { create, get } = new IncomeController();

incomeRoutes.route("/").get(get).post(create);
