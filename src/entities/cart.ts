import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Invoice } from "./invoice";

@Entity()
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  product_id: string;

  @Column({ nullable: true, type: "double" })
  discount: number;

  @Column()
  name: string;

  @Column({ type: "double" })
  selling_price: number;

  @Column()
  sku_id: string;

  @Column()
  quantity: number;

  @ManyToOne(() => Invoice, (iv) => iv.carts, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    cascade: true,
  })
  invoice: Invoice;
}
