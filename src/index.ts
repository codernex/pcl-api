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
  costingRoutes,
  customerRoutes,
  expenseRoutes,
  expenseTypeRoutes,
  incomeRoutes,
  lgAgentRoutes,
  paymentRoutes,
  planRoutes,
  productionRoutes,
  productRoutes,
  projectRoutes,
  savingsWithdrawRoutes,
  userRoutes,
  wastageRoutes,
} from "./routes";
import { depositRoutes } from "./routes/deposit";
import { incomeTypeRoutes } from "./routes/income-type";
import { reportRoutes } from "./routes/reports";
import { roleRoutes } from "./routes/role";
import { factoryRoutes } from "./routes/factory";

const mount = async (app: Application) => {
  appDataSource
    .initialize()
    .then(async () => {
      // await appDataSource.query(`SET GLOBAL time_zone = '+06:00';`);
      // await appDataSource.query(`SET time_zone = '+06:00';`);
      console.log("Database Connected")
    })
    .catch((err) => console.log(err));

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
  app.use("/api/v1/accounts", isAuthenticated, accountRoutes);
  app.use("/api/v1/expense", isAuthenticated, expenseRoutes);
  app.use("/api/v1/expense-types", isAuthenticated, expenseTypeRoutes);
  app.use("/api/v1/payments", isAuthenticated, paymentRoutes);
  app.use("/api/v1/saving-deposits", isAuthenticated, depositRoutes);
  app.use("/api/v1/income-type", isAuthenticated, incomeTypeRoutes);
  app.use("/api/v1/income", isAuthenticated, incomeRoutes);
  app.use("/api/v1/withdraw", isAuthenticated, savingsWithdrawRoutes);
  app.use("/api/v1/reports", isAuthenticated, reportRoutes);
  app.use("/api/v1/products", isAuthenticated, productRoutes);
  app.use("/api/v1/lc-agents", isAuthenticated, lgAgentRoutes);
  app.use("/api/v1/projects", isAuthenticated, projectRoutes);
  app.use("/api/v1/productions", isAuthenticated, productionRoutes);
  app.use("/api/v1/plans", isAuthenticated, planRoutes);
  app.use("/api/v1/costings", isAuthenticated, costingRoutes);
  app.use("/api/v1/factory", isAuthenticated, factoryRoutes);
  app.use("/api/v1/wastage", isAuthenticated, wastageRoutes);

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
