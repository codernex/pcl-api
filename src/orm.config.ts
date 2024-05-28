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
  Unit,
  User,
  Warranty,
} from "./entities";
import {
  InvoiceSubscriber,
  PaperSizeSubsciber,
  PurchaseSubscriber,
} from "./subscriber";
import { ProductGroupSubscriber } from "./subscriber/product-group";
import { CategorySubscriber } from "./subscriber/category";
import { BrandSubscriber } from "./subscriber/brand";
import { PurchasedCart } from "./entities/purchased.cart";

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
