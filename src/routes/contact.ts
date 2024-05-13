import {Router} from "express";
import {ContactController} from "../controller";

export const contactRoutes = Router()
const {createContact, getContacts} = new ContactController()
contactRoutes.route('/').post(createContact).get(getContacts)