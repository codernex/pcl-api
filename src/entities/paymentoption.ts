import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Account } from "./account";
import { Customer } from "./customer";
import { Project } from "./project";
@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (p) => p.payments)
  project: Project;

  @Column()
  paidAmount: number;

  @ManyToOne(() => Account)
  @JoinColumn()
  account: Account;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  refference:string

  @ManyToOne(() => Customer, (c) => c.payments, {
    cascade: true,
    onUpdate: "CASCADE",
    eager: true,
  })
  @JoinColumn({
    name: "customer_id",
    referencedColumnName: "id",
  })
  customer: Customer;

  @CreateDateColumn()
  created_at: Date;
}
