import { DataSource } from "typeorm";
import sanitizedConfig from "./config";
import {
  Account,
  AccountHistory,
  AmountTransfer,
  Business,
  Customer,
  Delivery,
  Documents,
  Expense,
  ExpenseType,
  Granter,
  Image,
  Income,
  IncomeType,
  LcAgent,
  Payment,
  PaymentDetails,
  PlanProject,
  Product,
  Production,
  Project,
  Role,
  SavingDeposit,
  SavingsWithdraw,
  Supplier,
  User,
} from "./entities";
import { VolatileProduct } from "./entities/volatile-product";
import { Costing } from "./entities/costing";
import { Factory } from "./entities/factory";
import { OpeningQuantity } from "./entities/opening-quantity";
import { FactoryVolatileProduct } from "./entities/FactoryVolatileProduct";
import { Wastage } from "./entities/wastage";
import { WastageProduct } from "./entities/wastage-product";
import { Slot } from "./entities/slot";
import { ProductionProduct } from "./entities/production-product";

export const appDataSource = new DataSource({
  type: "mysql",
  username: sanitizedConfig.DB_USER,
  password: sanitizedConfig.DB_PASS,
  port: sanitizedConfig.DB_PORT,
  database: sanitizedConfig.DB_NAME,
  entities: [
    User,
    Role,
    PaymentDetails,
    Customer,
    Image,
    Business,
    Payment,
    Granter,
    Supplier,
    Account,
    AccountHistory,
    Expense,
    ExpenseType,
    SavingDeposit,
    Income,
    IncomeType,
    SavingsWithdraw,
    AmountTransfer,
    Product,
    LcAgent,
    Project,
    Delivery,
    PlanProject,
    Production,
    VolatileProduct,
    Documents,
    Costing,
    Factory,
    OpeningQuantity,
    FactoryVolatileProduct,
    Wastage,
    WastageProduct,
    Slot,
    ProductionProduct
  ],
  synchronize: true,
  host: sanitizedConfig.DB_HOST,
});
