import { Router } from "express";
import { ExpenseController } from "../controller";

export const expenseRoutes = Router();

const { create, get } = new ExpenseController();

expenseRoutes.route('/').get(get).post(create)