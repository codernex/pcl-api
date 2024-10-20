import { Router } from "express";
import { ReportController } from "../controller";

export const reportRoutes = Router();
const { getCashFlow } = new ReportController();

reportRoutes.route("/cash-flow").get(getCashFlow);
