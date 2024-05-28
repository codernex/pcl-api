import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Purchase } from "./purchase";

@Entity()
export class PurchasedCart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  sku_id: string;

  @Column()
  quantity: number;

  @Column()
  product_type: string;

  @Column({ type: "double" })
  selling_price: number;

  @Column({ default: false })
  return_to_supplier: boolean;

  @Column({ type: "double" })
  purchase_price: number;

  @ManyToOne(() => Purchase, (purchase) => purchase.purchasedCart, {
    onDelete: "CASCADE",
  })
  purchases: Purchase;
}
