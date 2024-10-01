import { Router } from "express";
import { ReportController } from "../controller/reports";

export const reportRoutes = Router();
const {
  getRetailDueList,
  getHireDueList,
  getSavingsHireDueList,
  getSeasonalHireDueList,
} = new ReportController();

reportRoutes.get("/retail-due", getRetailDueList);
reportRoutes.get("/hire-due", getHireDueList);
reportRoutes.get("/savings-hire-due", getSavingsHireDueList);
reportRoutes.get("/seasonal-hire-due", getSeasonalHireDueList);
