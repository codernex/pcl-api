import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product";

@Entity()
export class SalesReturn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  amount: number;

  @ManyToMany(() => Product, { eager: true, cascade: true })
  @JoinTable({
    name: "sales_return_products",
  })
  products: Product[];

  addProduct(product: Product) {
    if (this.products == null) {
      this.products = new Array<Product>();
    }
    this.products.push(product);
  }
}
