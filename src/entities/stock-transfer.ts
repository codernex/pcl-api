import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Product } from "./product";

@Entity()
export class StockTransfer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  transfered_form: string;

  @Column()
  transfered_to: string;

  @ManyToMany(() => Product, (product) => product.stock_transfer, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  @JoinTable()
  products: Product[];

  @Column({ nullable: true })
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
