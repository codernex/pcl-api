import { Router } from "express";
import { ProductController } from "../controller";
import { uploadImage } from "../utils";

export const productRoutes = Router();
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductsByWarehouse,
  getAllProducts,
} = new ProductController();

productRoutes
  .route("/")
  .get(getProducts)
  .post(uploadImage.array("images"), createProduct);

productRoutes.route("/:name").patch(uploadImage.array("images"), updateProduct);

productRoutes.delete("/:id", deleteProduct);

productRoutes.get("/warehouse", getProductsByWarehouse);

productRoutes.get("/all", getAllProducts);
