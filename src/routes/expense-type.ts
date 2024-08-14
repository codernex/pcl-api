import { Router } from "express";
import { ExpenseTypeController } from "../controller";

export const expenseTypeRoutes = Router();

const { create, get } = new ExpenseTypeController();
expenseTypeRoutes.route("/").get(get).post(create);
