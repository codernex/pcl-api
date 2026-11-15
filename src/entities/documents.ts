import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Delivery, Project } from "./project";
import { Customer } from "./customer";

@Entity()
export class Documents {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  name: string;

  @ManyToOne(() => Project, (p) => p.documents, { nullable: true })
  project: Project;

  @ManyToOne(() => Delivery, (d) => d.documents, { nullable: true })
  delivery: Delivery;

  @ManyToOne(() => Customer, (c) => c.documents, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    nullable: true,
  })
  customer: Customer;

  @CreateDateColumn()
  created_at: Date;
}

