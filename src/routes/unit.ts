import {Router} from "express";
import {UnitController} from "../controller";

export const unitRoutes = Router();

const {create, get, update, remove} = new UnitController();

unitRoutes
    .route("/")
    .get(get)
    .post(create);

unitRoutes.route("/:id").patch( update).delete( remove);