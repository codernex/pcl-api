import {Router} from "express";
import {ModelController} from "../controller";
import {uploadImage} from "../utils";

export const modelRoutes = Router();
const {create, get, update, remove} = new ModelController();
modelRoutes
    .route("/")
    .get(get)
    .post( uploadImage.single("image"),create);

modelRoutes.route("/:id").patch(uploadImage.single("image"), update).delete( remove);