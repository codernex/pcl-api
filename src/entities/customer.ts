import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Invoice } from "./invoice";
import { PaymentOption } from "./paymentoption";
import { Granter } from "./granter";

@Entity()
export class Customer extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  husband_or_parent_name: string;

  @Column()
  mobile: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  credit_limit: number;

  @Column({ nullable: true, default: 0 })
  opening_balance: number;

  @Column({ nullable: true, default: 0 })
  due: number;

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

  @Column({ nullable: true })
  alternative_name: string;

  @Column({ nullable: true })
  alternative_number: string;

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
  
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
