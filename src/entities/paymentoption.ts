import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Contacts } from "./contacts";
export enum PaymentMethod {
  CASH = "CASH",
  CREDIT_CARD = "CREDIT_CARD",
  CREDIT = "CREDIT",
  BKASH = "BKASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  NAGAD = "NAGAD",
  ROCKET = "ROCKET",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  DUE = "DUE",
}
@Entity()
export class PaymentOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @Column()
  type: string;

  @Column({ nullable: true, type: "enum", enum: PaymentMethod })
  payment_method: PaymentMethod;

  @Column({
    nullable: true,
    enum: PaymentStatus,
    default: PaymentStatus.PAID,
    type: "enum",
  })
  payment_status: PaymentStatus;

  @Column()
  reciver_id: number;

  @Column({ nullable: true })
  recived_by: string;

  @ManyToOne(() => Contacts, (c) => c.payment_option, {
    cascade: true,
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "contact_id",
    referencedColumnName: "id",
  })
  contact: Contacts;
}
