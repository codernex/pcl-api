import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product";
import { Invoice } from "./invoice";
import { Customer } from "./customer";

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

  @ManyToOne(() => Customer, { cascade: true })
  @JoinColumn()
  customer: Customer;

  @ManyToOne(() => Invoice, { cascade: true })
  @JoinColumn()
  invoice: Invoice;

  @CreateDateColumn()
  created_at: Date;

  addProduct(product: Product) {
    if (this.products == null) {
      this.products = new Array<Product>();
    }
    this.products.push(product);
  }
}
