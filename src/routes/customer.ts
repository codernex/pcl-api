import { Router } from "express";
import { ContactController } from "../controller";
import { uploadImage } from "../utils";
export const customerRoutes = Router();
const {
  createContact,
  getContact,
  getContacts,
  updateContact,
  collectDue,
  addGranter,
  uploadDocuments,
  deleteDocument,
  deposit,
} = new ContactController();
customerRoutes.route("/").post(createContact).get(getContacts);
customerRoutes.patch("/deposit", deposit);
customerRoutes.route("/:id").get(getContact).patch(updateContact);
customerRoutes.route("/collect-due/:id").patch(collectDue);
customerRoutes.post("/:id/granter", addGranter);
customerRoutes.post(
  "/:id/document",
  uploadImage.array("documents"),
  uploadDocuments
);
customerRoutes.delete("/:id/document/:docId", deleteDocument);
