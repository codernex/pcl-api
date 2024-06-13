import { Router } from "express";
import { ContactController } from "../controller";
export const contactRoutes = Router();
const { createContact, getContacts, updateContact, collectDue, payDue } =
  new ContactController();
contactRoutes.route("/").post(createContact).get(getContacts);
contactRoutes.route("/:id").patch(updateContact);
contactRoutes.route("/collect-due/:id").patch(collectDue);
contactRoutes.route("/pay-due/:id").patch(payDue);
