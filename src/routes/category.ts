import {Router} from "express";
import {CategoryController} from "../controller";
import {upload} from "../utils";

export const categoryRoutes = Router();
const {createCategory, getCategories, updateCategory, removeCategory} =
    new CategoryController();


categoryRoutes
    .route("/")
    .get(getCategories)
    .post(
        upload.single("image"),
        createCategory
    );

categoryRoutes
    .route("/:id")
    .patch(
        upload.single("image"),
        updateCategory
    )
    .delete(removeCategory);
