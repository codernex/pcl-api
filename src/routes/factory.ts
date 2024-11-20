import { Router } from "express";
import { FactoryController } from "../controller";

export const factoryRoutes = Router();

const { create, get } = new FactoryController();

factoryRoutes.route("/").get(get).post(create);
