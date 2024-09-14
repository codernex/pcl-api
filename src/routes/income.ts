import { Router } from "express";
import { IncomeController } from "../controller/income";

export const incomeRoutes = Router();
const { create, get } = new IncomeController();

incomeRoutes.route("/").get(get).post(create);
