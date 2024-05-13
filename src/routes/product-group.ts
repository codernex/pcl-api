import {Router} from "express";
import {ProductGroupController} from "../controller";

export const productGroupRoutes = Router();
const { create, get, update, remove } = new ProductGroupController();

productGroupRoutes
  .route("/")
  .post(
    create
  )
  .get(get);
productGroupRoutes
  .route("/:id")
  .patch(update)
  .delete(remove);
