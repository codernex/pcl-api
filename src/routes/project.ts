import { Router } from "express";
import { ProjectController } from "../controller";
import { uploadImage } from "../utils";

export const projectRoutes = Router();
const {
  addProject,
  getProjects,
  addDelivery,
  uploadDocuments,
  getDelivery,
  updateStatus,
  uploadDeliveryDocuments,
} = new ProjectController();
projectRoutes.route("/").get(getProjects).post(addProject);
projectRoutes
  .route("/delivery")
  .post(uploadImage.single("file"), addDelivery)
  .get(getDelivery)
  .patch(updateStatus);
projectRoutes.post("/documents", uploadImage.single("file"), uploadDocuments);

projectRoutes.post(
  "/delivery/document",
  uploadImage.single("file"),
  uploadDeliveryDocuments
);
