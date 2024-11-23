import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "./project";
import { Product } from "./product";
import { Customer } from "./customer";
import { Factory } from "./factory";
import { ProductionProduct } from "./production-product";

export enum Shift {
  DAY = "DAY",
  NIGHT = "NIGHT",
}

@Entity()
export class Production {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Project, (p) => p.productions, { nullable: true })
  project: Project;

  @OneToMany(() => ProductionProduct, (p) => p.production, { eager: true })
  products: ProductionProduct[];

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn()
  customer: Customer;

  @Column({ default: 0 })
  dayShift: number;

  @Column({ default: 0 })
  nightShift: number;

  @ManyToOne(() => Factory, (f) => f.productions)
  factory: Factory;

  @CreateDateColumn()
  createdAt: Date;
}
