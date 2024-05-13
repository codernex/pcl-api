import {Router} from "express";
import {WarrantyController} from "../controller";

export const warrantyRoutes = Router();

const {createWarranty, getWarranties, update, remove} = new WarrantyController();

warrantyRoutes
    .route("/")
    .get(getWarranties)
    .post(createWarranty);

warrantyRoutes.route('/:id').patch(update).delete(remove)