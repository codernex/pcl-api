import cors from "cors";
import express, { Application } from "express";
import path from "path";
import sanitizedConfig from "./config";
import errorMiddleware from "./middleware/err";
import { isAuthenticated } from "./middleware/isAuth";
import { appDataSource } from "./orm.config";
import {
  brandRoutes,
  businessRoutes,
  categoryRoutes,
  colorRoutes,
  contactRoutes,
  invoiceRoutes,
  modelRoutes,
  paperRoutes,
  productGroupRoutes,
  productRoutes,
  purchaseRoutes,
  unitRoutes,
  userRoutes,
  warrantyRoutes,
} from "./routes";

const mount = async (app: Application) => {
  await appDataSource.initialize();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // Define the path to your uploads folder containing images
  const uploadFolderPath = path.join(__dirname, "../", "uploads");

  // Serve the uploads folder statically
  app.use("/uploads", express.static(uploadFolderPath));
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/contacts", isAuthenticated, contactRoutes);
  app.use("/api/v1/products", isAuthenticated, productRoutes);
  app.use("/api/v1/warranties", isAuthenticated, warrantyRoutes);
  app.use("/api/v1/units", isAuthenticated, unitRoutes);
  app.use("/api/v1/categories", isAuthenticated, categoryRoutes);
  app.use("/api/v1/models", isAuthenticated, modelRoutes);
  app.use("/api/v1/product-groups", isAuthenticated, productGroupRoutes);
  app.use("/api/v1/colors", isAuthenticated, colorRoutes);
  app.use("/api/v1/brands", isAuthenticated, brandRoutes);
  app.use("/api/v1/business", isAuthenticated, businessRoutes);
  app.use("/api/v1/purchase", isAuthenticated, purchaseRoutes);
  app.use("/api/v1/invoices", isAuthenticated, invoiceRoutes);
  app.use("/api/v1/paper", isAuthenticated, paperRoutes);

  app.get("/api/v1/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app.use(errorMiddleware);

  const server = app.listen(sanitizedConfig.PORT, "0.0.0.0", () => {
    console.log(`Development Server Started on PORT: ${sanitizedConfig.PORT}`);
  });
};

mount(express()).catch((e) => console.log(e));
