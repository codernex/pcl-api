import {Router} from "express";
import {BrandController} from "../controller";
import {upload} from "../utils";

export const brandRoutes = Router();

const {createBrand, getBrands, deleteBrand, updateBrand} =
    new BrandController();
brandRoutes
    .route("/")
    .get(getBrands)
    .post(
        upload.single("image"),
        createBrand
    );

brandRoutes
    .route("/:id")
    .patch(
        upload.single("image"),
        updateBrand
    )
    .delete(
        deleteBrand
    );
