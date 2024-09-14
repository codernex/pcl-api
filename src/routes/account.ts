import { Router } from "express";
import { AccountController } from "../controller";

export const accountRoutes = Router();

const { create, get, getAccountHistory } = new AccountController();

accountRoutes.route("/").get(get).post(create);
accountRoutes.get("/history", getAccountHistory);
