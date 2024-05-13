import {Router} from "express";
import {ModelController} from "../controller";
import {upload} from "../utils";

export const modelRoutes = Router();
const {create, get, update, remove} = new ModelController();
modelRoutes
    .route("/")
    .get(get)
    .post( upload.single("image"),create);

modelRoutes.route("/:id").patch(upload.single("image"), update).delete( remove);