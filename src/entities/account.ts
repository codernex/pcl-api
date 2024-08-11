import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AccountHistory } from "./account-history";

export enum AccountType {
  CASH = "CASH",
  BANK = "BANK",
  BKASH = "BKASH",
  NAGAD = "NAGAD",
  ROCKET = "ROCKET",
  INSTALLMENT = "INSTALLMENT",
}

export enum AccountState {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ enum: AccountType, type: "enum" })
  accountType: AccountType;

  @Column({ default: false })
  default: boolean;

  @Column({ enum: AccountState, type: "enum", nullable: true })
  accountState: AccountState;

  @OneToMany(() => AccountHistory, (ac) => ac.account, {
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
    eager: true,
  })
  accountHistory: AccountHistory[];

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
