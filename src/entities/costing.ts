import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "./project";
import { Customer } from "./customer";

@Entity()
export class Costing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "bigint",
    transformer: {
      to: (v) => v.toString(),
      from: (v) => parseInt(v),
    },
  })
  amount: number;

  @ManyToOne(() => Project, (p) => p.costings)
  project: Project;

  @ManyToOne(() => Customer)
  @JoinColumn()
  customer: Customer;

  @CreateDateColumn()
  createdAt: Date;
}
