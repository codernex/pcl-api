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

export enum TransactionType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
  OPENING_BALANCE = "OPENING_BALANCE",
}

@Entity()
export class AccountHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ enum: TransactionType, type: "enum" })
  transactionType: TransactionType;

  @ManyToOne(() => Account, (account) => account.accountHistory, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  account: Account;

  @ManyToOne(() => Customer, {
    cascade: true,
  })
  @JoinColumn()
  customer: Customer;

  @Column({ type: "bigint" })
  amount: number;

  @Column({ nullable: true })
  remark: string;

  @Column({ nullable: true })
  type: string;

  @CreateDateColumn()
  createdAt: Date;
}
