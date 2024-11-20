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
import { Payment } from "./paymentoption";
import { SavingDeposit } from "./saving-deposit";

@Entity()
export class Customer extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  account_number: string;

  @Column()
  name: string;

  @Column()
  company_name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true })
  mobile: string;

  @Column()
  designation: string;

  @Column({ nullable: true })
  alternative_name: string;

  @Column({ nullable: true })
  alternative_mobile: string;

  @Column({ default: 0, type: "bigint" })
  opening_balance: number;

  @Column({ default: 0, type: "bigint" })
  credit_limit: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  husband_or_parent_name: string;

  @Column({ default: 0, type: "bigint" })
  savings: number;

  @Column({ default: false })
  is_hire_account_closed: boolean;

  @Column({ nullable: true, default: 0, type: "bigint" })
  due: number;

  @Column({ nullable: true })
  religion: string;

  @Column({ nullable: true })
  nid: string;

  @Column({ nullable: true })
  profession: string;

  @Column({ nullable: true })
  nationality: string;

  @OneToMany(() => Payment, (p) => p.customer)
  payments: Payment[];
  
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

  @Column({ default: 0 })
  installment_period: number;

  @Column({ default: false })
  seasonal_approved: boolean;

  @OneToMany(() => SavingDeposit, (savingDeposit) => savingDeposit.customer, {
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  savingDeposit: SavingDeposit[];

  @Column({
    default: false,
  })
  savingsCustomer: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
