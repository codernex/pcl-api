import { Router } from "express";
import { AccountController } from "../controller";

export const accountRoutes = Router();

const { create, get } = new AccountController();

accountRoutes.route("/").get(get).post(create);
