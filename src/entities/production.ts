import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "./project";
import { Product } from "./product";
import { Customer } from "./customer";
import { Factory } from "./factory";

@Entity()
export class Production {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Project, (p) => p.productions, { nullable: true })
  project: Project;

  @ManyToOne(() => Product, (p) => p.productions, { eager: true })
  product: Product;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn()
  customer: Customer;

  @ManyToOne(() => Factory, (f) => f.productions)
  factory: Factory;

  @CreateDateColumn()
  createdAt: Date;
}
