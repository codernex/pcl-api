import { Router } from "express";
import { SavingsWithdrawController } from "../controller";

export const savingsWithdrawRoutes = Router();

const { create, get } = new SavingsWithdrawController();

savingsWithdrawRoutes.route("/").get(get).post(create);
