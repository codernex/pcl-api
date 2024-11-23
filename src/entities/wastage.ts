import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "./project";
import { Factory } from "./factory";
import { Customer } from "./customer";
import { WastageProduct } from "./wastage-product";

@Entity()
export class Wastage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Project, (p) => p.wastages)
  project: Project;

  @ManyToOne(() => Factory, (f) => f.wastages)
  factory: Factory;

  @ManyToOne(() => Customer, (c) => c.wastages)
  customer: Customer;

  @ManyToMany(() => WastageProduct, (p) => p.wastages)
  @JoinTable({
    name: "wastage_products",
  })
  products: WastageProduct[];

  @Column()
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
