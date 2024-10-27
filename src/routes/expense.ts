import { Router } from "express";
import { ExpenseController } from "../controller";
import { uploadImage } from "../utils";

export const expenseRoutes = Router();

const { create, get } = new ExpenseController();

expenseRoutes
  .route("/")
  .get(get)
  .post(
    uploadImage.single("attachment"),
    (req, res, next) => {
      req.body = JSON.parse(JSON.stringify(req.body));
      next();
    },
    create
  );
