import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Business } from "./business";
import { Product } from "./product";

@Entity()
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Business, {
    cascade: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    eager: true,
  })
  @JoinColumn()
  business: Business;

  @OneToMany(() => Product, (p) => p.warehouse, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
    eager: true,
  })
  products: Product[];
}
