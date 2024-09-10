import { Router } from "express";
import { ContactController } from "../controller";
import { uploadImage } from "../utils";
export const customerRoutes = Router();
const {
  createContact,
  getContacts,
  updateContact,
  collectDue,
  addGranter,
  uploadDocuments,
  approveCustomer,
  collectInstallment,
  deposit,
  collectLPR
} = new ContactController();
customerRoutes.route("/").post(createContact).get(getContacts);
customerRoutes.patch("/deposit", deposit);
customerRoutes.patch("/collect-installment", collectInstallment);
customerRoutes.patch('/collect-lpr',collectLPR)
customerRoutes.route("/:id").patch(updateContact);
customerRoutes.route("/collect-due/:id").patch(collectDue);
customerRoutes.post("/:id/granter", addGranter);
customerRoutes.patch("/:id/approve", approveCustomer);
customerRoutes.post(
  "/:id/document",
  uploadImage.array("documents"),
  uploadDocuments
);
