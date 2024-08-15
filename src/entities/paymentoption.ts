import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Customer } from "./customer";
import { Supplier } from "./supplier";
export enum PaymentMethod {
  CASH = "CASH",
  BKASH = "BKASH",
  BANK = "BANK",
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

  @Column({ nullable: true })
  paid_amount: number;

  @Column({ nullable: true })
  discount_amount: number;

  @Column({ nullable: true })
  change_amount: number;

  @Column({ nullable: true })
  due_amount: number;

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

  @ManyToOne(() => Customer, (c) => c.payment_option, {
    cascade: true,
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "contact_id",
    referencedColumnName: "id",
  })
  contact: Customer;

  @ManyToOne(() => Supplier, (s) => s.paymentOptions, {
    cascade: true,
    onUpdate: "CASCADE",
  })
  @JoinColumn({
    name: "supplier_id",
    referencedColumnName: "id",
  })
  supplier: Supplier;

  @CreateDateColumn()
  created_at: Date;
}
