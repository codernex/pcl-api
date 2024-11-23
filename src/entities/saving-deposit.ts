import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Customer } from "./customer";
import { Account } from "./account";

@Entity("saving_deposits")
export class SavingDeposit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "bigint",transformer:{
    to: (v) => v.toString(),
    from: (v) => parseInt(v),
  } })
  amount: number;

  @ManyToOne(() => Customer, (customer) => customer.savingDeposit, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    eager: true,
  })
  customer: Customer;

  @Column({ type: "bigint",transformer:{
    to: (v) => v.toString(),
    from: (v) => parseInt(v),
  } })
  cost: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
