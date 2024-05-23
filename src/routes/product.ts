import {Router} from "express";
import {ProductController} from "../controller";
import {upload} from "../utils";

export const productRoutes = Router();
const {createProduct, updateProduct, deleteProduct, getProducts,getProduct} =
    new ProductController();

productRoutes.route("/").get(getProducts).post(
    upload.array("images"),
    createProduct
);

productRoutes
    .route("/:name")
    .patch(upload.array("images"), updateProduct)

productRoutes.delete('/:id',deleteProduct)
