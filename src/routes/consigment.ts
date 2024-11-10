import { Router } from "express";
import { ConsignmentController } from "../controller/consignment";

export const consignmentRoutes = Router();
const { create, get, updateStatus } = new ConsignmentController();

consignmentRoutes.route("/").get(get).post(create);

consignmentRoutes.patch("/:id/status", updateStatus);
