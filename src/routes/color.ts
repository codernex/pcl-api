import {Router} from "express";
import {ColorController} from "../controller";

export const colorRoutes = Router();
const {create, get, update, remove} = new ColorController();
colorRoutes
    .route("/")
    .get(get)
    .post(create);

colorRoutes
    .route("/:id")
    .patch(update)
    .delete(remove);
