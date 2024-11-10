import { Router } from "express";
import { LcAgentController } from "../controller";

export const lgAgentRoutes = Router();

const { create, get } = new LcAgentController();

lgAgentRoutes.route("/").get(get).post(create);
