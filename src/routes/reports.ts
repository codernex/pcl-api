import { Router } from "express";
import { ReportController } from "../controller/reports";

export const reportRoutes = Router();
const { getRetailDueList } = new ReportController();

reportRoutes.get("/retail-due", getRetailDueList);
