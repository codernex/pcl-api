import { Router } from "express";
import { PlanController } from "../controller/plan-project";

export const planRoutes = Router();

const { creatPlan, getPlan } = new PlanController();

planRoutes.route("/").get(getPlan).post(creatPlan);
