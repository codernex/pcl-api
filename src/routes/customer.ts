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
  approveCustomer
} = new ContactController();
customerRoutes.route("/").post(createContact).get(getContacts);
customerRoutes.route("/:id").patch(updateContact);
customerRoutes.route("/collect-due/:id").patch(collectDue);
customerRoutes.post("/:id/granter", addGranter);
customerRoutes.patch("/:id/approve", approveCustomer);
customerRoutes.post(
  "/:id/document",
  uploadImage.array("documents"),
  uploadDocuments
);
