import {Router} from "express";
import {SizeController} from "../controller";

export const sizeRoutes = Router();
const {create, get, update, remove} = new SizeController();
sizeRoutes
    .route("/")
    .get(get)
    .post( create);
sizeRoutes.route("/:id").patch( update).delete(remove)