import { Router } from "express";
import { AccountController } from "../controller";

export const accountRoutes = Router();

const { create, get, getAccountHistory, transferAmount, getTransferHisoty } =
  new AccountController();

accountRoutes.route("/").get(get).post(create);
accountRoutes.get("/history/:accountId", getAccountHistory);
accountRoutes.route("/transfer").get(getTransferHisoty).post(transferAmount);
