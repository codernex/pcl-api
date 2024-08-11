import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Account } from "./account";

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

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}
