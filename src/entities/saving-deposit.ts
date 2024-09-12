import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Customer } from "./customer";

@Entity("saving_deposits")
export class SavingDeposit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @ManyToOne(() => Customer, (customer) => customer.savingDeposit, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    eager: true,
  })
  customer: Customer;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
