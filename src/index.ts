import cors from "cors";
import express, { Application } from "express";
import path from "path";
import sanitizedConfig from "./config";
import errorMiddleware from "./middleware/err";
import { isAuthenticated } from "./middleware/isAuth";
import { appDataSource } from "./orm.config";
import {
  accountRoutes,
  businessRoutes,
  customerRoutes,
  expenseRoutes,
  expenseTypeRoutes,
  incomeRoutes,
  paymentRoutes,
  portRoutest,
  productRoutes,
  savingsWithdrawRoutes,
  supplierRoutes,
  userRoutes,
} from "./routes";
import { roleRoutes } from "./routes/role";
import { depositRoutes } from "./routes/deposit";
import { incomeTypeRoutes } from "./routes/income-type";
import { reportRoutes } from "./routes/reports";

const mount = async (app: Application) => {
  await appDataSource.initialize();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // Define the path to your uploads folder containing images
  const uploadFolderPath = path.join(__dirname, "../", "uploads");

  // Serve the uploads folder statically
  app.use("/api/v1/uploads", express.static(uploadFolderPath));
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/contacts", isAuthenticated, customerRoutes);
  app.use("/api/v1/business", isAuthenticated, businessRoutes);
  app.use("/api/v1/roles", isAuthenticated, roleRoutes);
  app.use("/api/v1/supplier", isAuthenticated, supplierRoutes);
  app.use("/api/v1/accounts", isAuthenticated, accountRoutes);
  app.use("/api/v1/expense", isAuthenticated, expenseRoutes);
  app.use("/api/v1/expense-types", isAuthenticated, expenseTypeRoutes);
  app.use("/api/v1/payments", isAuthenticated, paymentRoutes);
  app.use("/api/v1/saving-deposits", isAuthenticated, depositRoutes);
  app.use("/api/v1/income-type", isAuthenticated, incomeTypeRoutes);
  app.use("/api/v1/income", isAuthenticated, incomeRoutes);
  app.use("/api/v1/withdraw", isAuthenticated, savingsWithdrawRoutes);
  app.use("/api/v1/reports", isAuthenticated, reportRoutes);
  app.use("/api/v1/ports", isAuthenticated, portRoutest);
  app.use("/api/v1/products", isAuthenticated, productRoutes);
  app.get("/api/v1/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Error middleware
  app.use(errorMiddleware);

  const server = app.listen(sanitizedConfig.PORT, "0.0.0.0", () => {
    console.log(`Development Server Started on PORT: ${sanitizedConfig.PORT}`);
  });
};

mount(express()).catch((e) => console.log(e));
