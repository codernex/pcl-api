import { Router } from "express";
import { InvoiceController } from "../controller/invoice";

export const invoiceRoutes = Router();

const { createInvoice, getInvoice } = new InvoiceController();

invoiceRoutes.route("/").post(createInvoice).get(getInvoice);
