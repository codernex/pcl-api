import { Router } from "express";
import { PortController } from "../controller";

export const portRoutest = Router();
const { create, get } = new PortController();

portRoutest.route("/").post(create).get(get);
