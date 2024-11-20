import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "./project";
import { VolatileProduct } from "./volatile-product";
import { Customer } from "./customer";

@Entity()
export class PlanProject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @ManyToOne(() => Project, (p) => p.planProject, {
    cascade: true,
    onDelete: "CASCADE",
  })
  project: Project;

  @ManyToOne(() => Customer)
  @JoinColumn()
  customer: Customer;

  @Column()
  productionPerDay: number;

  @Column()
  dayCount: number;

  @ManyToOne(() => VolatileProduct)
  @JoinColumn()
  product: VolatileProduct;

  @CreateDateColumn()
  createdAt: Date;
}
