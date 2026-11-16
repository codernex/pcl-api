import { Router } from "express";
import { CrmController } from "../controller";

export const crmRoutes = Router();
const {
  getDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
  getCrmStats,
  getActivities,
  createActivity,
  deleteActivity,
} = new CrmController();

// Statistics
crmRoutes.get("/stats", getCrmStats);

// Deals endpoints
crmRoutes.route("/deals").get(getDeals).post(createDeal);
crmRoutes.route("/deals/:id").get(getDealById).patch(updateDeal).delete(deleteDeal);
crmRoutes.patch("/deals/:id/stage", updateDealStage);

// Activities endpoints
crmRoutes.route("/activities").get(getActivities).post(createActivity);
crmRoutes.delete("/activities/:id", deleteActivity);
