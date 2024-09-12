import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Granter } from "./granter";
import { Installments } from "./installment";
import { Invoice } from "./invoice";
import { PaymentOption } from "./paymentoption";
import { SavingDeposit } from "./saving-deposit";
import { Seasonal } from "./seasonal";

@Entity()
export class Customer extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  account_number: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  husband_or_parent_name: string;

  @Column({ default: 0 })
  savings: number;

  @Column({ default: false })
  is_hire_account_closed: boolean;

  @Column()
  mobile: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true, default: 0 })
  cash_due: number;

  @Column({ nullable: true, default: 0 })
  hire_due: number;

  @Column({ nullable: true })
  present_address: string;

  @Column({ nullable: true })
  permanent_address: string;

  @Column({ nullable: true })
  religion: string;

  @Column({ nullable: true })
  nid: string;

  @Column({ nullable: true })
  profession: string;

  @Column({ nullable: true })
  nationality: string;

  @OneToMany(() => PaymentOption, (p) => p.contact)
  payment_option: PaymentOption[];

  @OneToMany(() => Invoice, (iv) => iv.contact)
  invoices: Invoice[];

  @OneToMany(() => Granter, (g) => g.customer, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
    eager: true,
  })
  granter: Granter[];

  @Column({ nullable: true, type: "text" })
  documents: string;

  @Column({ nullable: true, default: false })
  approved: boolean;

  @OneToMany(() => Installments, (installments) => installments.customer, {
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  installments: Installments[];

  @OneToMany(() => Seasonal, (s) => s.customer, {
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  seasonal: Seasonal[];

  @OneToMany(() => SavingDeposit, (savingDeposit) => savingDeposit.customer, {
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  savingDeposit: SavingDeposit[];

  @Column({
    default: false,
  })
  savingsCustomer: false;
  
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
