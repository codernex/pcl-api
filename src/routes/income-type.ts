import { Router } from "express";
import { IncomeTypeController } from "../controller/income-type";

export const incomeTypeRoutes = Router();
const { create, get } = new IncomeTypeController();

incomeTypeRoutes.route("/").get(get).post(create);
