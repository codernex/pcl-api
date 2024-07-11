import { DataSource } from "typeorm";
import sanitizedConfig from "./config";
import {
  Brand,
  Business,
  Cart,
  Category,
  Color,
  Contacts,
  Image,
  Invoice,
  InvoicePaper,
  Model,
  PaymentDetails,
  PaymentOption,
  Product,
  ProductGroup,
  Purchase,
  Role,
  StockTransfer,
  Unit,
  User,
  Warranty,
} from "./entities";
import { PurchasedCart } from "./entities/purchased.cart";
import { Warehouse } from "./entities/warehouse";
import {
  InvoiceSubscriber,
  PaperSizeSubsciber,
  PurchaseSubscriber,
} from "./subscriber";
import { BrandSubscriber } from "./subscriber/brand";
import { CategorySubscriber } from "./subscriber/category";
import { ProductGroupSubscriber } from "./subscriber/product-group";

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
    Contacts,
    Product,
    Brand,
    Model,
    ProductGroup,
    Category,
    Color,
    Warranty,
    Image,
    Unit,
    Business,
    Purchase,
    PaymentOption,
    Invoice,
    Cart,
    InvoicePaper,
    PurchasedCart,
    Warehouse,
    StockTransfer,
  ],
  synchronize: true,
  subscribers: [
    PaperSizeSubsciber,
    InvoiceSubscriber,
    PurchaseSubscriber,
    ProductGroupSubscriber,
    CategorySubscriber,
    BrandSubscriber,
  ],
  host: sanitizedConfig.DB_HOST,
});
