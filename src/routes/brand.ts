import {Router} from "express";
import {BrandController} from "../controller";
import {uploadImage} from "../utils";

export const brandRoutes = Router();

const {createBrand, getBrands, deleteBrand, updateBrand} =
    new BrandController();
brandRoutes
    .route("/")
    .get(getBrands)
    .post(
        uploadImage.single("image"),
        createBrand
    );

brandRoutes
    .route("/:id")
    .patch(
        uploadImage.single("image"),
        updateBrand
    )
    .delete(
        deleteBrand
    );
