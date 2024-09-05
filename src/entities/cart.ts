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

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  product_type: string;

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
