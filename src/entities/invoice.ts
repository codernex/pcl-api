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
import { Contacts } from "./contacts";
import { PaymentOption } from "./paymentoption";
import { Cart } from "./cart";

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Business)
  @JoinColumn()
  business: Business;

  @Column({ type: "double" })
  total_amount: number;

  @Column({ type: "double" })
  paid_amount: number;

  @Column({ type: "double", nullable: true })
  due_amount: number;

  @Column({ nullable: true, type: "double" })
  change_amount: number;

  @Column()
  quantity: number;

  @Column({ type: "double", nullable: true })
  discount: number;

  @Column()
  status: string;

  @ManyToOne(() => Contacts, (c) => c.invoices, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  contact: Contacts;

  @OneToOne(() => PaymentOption)
  @JoinColumn()
  payment: PaymentOption;

  @OneToMany(() => Cart, (c) => c.invoice)
  carts: Cart[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
