import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Business } from "./business";
import { Customer } from "./customer";
import { PaymentOption } from "./paymentoption";
import { Cart } from "./cart";
import { Installments } from "./installment";

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  invoice_id: string;
  @ManyToOne(() => Business)
  @JoinColumn()
  business: Business;

  @Column({ type: "double" })
  total_amount: number;

  @Column({ nullable: true, type: "double" })
  amount_after_discount: number;

  @Column({ nullable: true, type: "double", default: 0 })
  discount: number;

  @Column({ nullable: true, default: "FIXED" })
  discountType: "FIXED" | "PERCENTAGE";

  @Column({ type: "double" })
  paid_amount: number;

  @Column({ type: "double", nullable: true })
  due_amount: number;

  @Column({ type: "double", nullable: true })
  transport_cost: number;

  @Column({ nullable: true, type: "double" })
  change_amount: number;

  @Column({ nullable: true })
  sales_type: string;
  
  @Column()
  quantity: number;

  @Column()
  status: string;

  @ManyToOne(() => Customer, (c) => c.invoices, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  contact: Customer;

  @OneToOne(() => PaymentOption, {
    eager: true,
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  @JoinColumn()
  payment: PaymentOption;

  @OneToMany(() => Cart, (c) => c.invoice, { eager: true })
  carts: Cart[];

  @OneToMany(() => Installments, (iv) => iv.invoice)
  installments: Installments[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
