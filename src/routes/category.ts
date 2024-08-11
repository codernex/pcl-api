import {Router} from "express";
import {CategoryController} from "../controller";
import {uploadImage} from "../utils";

export const categoryRoutes = Router();
const {createCategory, getCategories, updateCategory, removeCategory} =
    new CategoryController();


categoryRoutes
    .route("/")
    .get(getCategories)
    .post(
        uploadImage.single("image"),
        createCategory
    );

categoryRoutes
    .route("/:id")
    .patch(
        uploadImage.single("image"),
        updateCategory
    )
    .delete(removeCategory);
