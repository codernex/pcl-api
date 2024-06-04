import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Invoice } from "./invoice";
import { PaymentDetails } from "./payment";
import { PaymentOption } from "./paymentoption";

@Entity()
export class Contacts extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  mobile: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  credit_limit: number;

  @Column({ nullable: true, default: 0 })
  customer_opening_balance: number;

  @Column({ nullable: true, default: 0 })
  supplier_opening_balance: number;

  @Column({ nullable: true, type: "double" })
  due_from_owner: number;

  @Column({ nullable: true })
  due_from_supplier: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  alternative_name: string;

  @Column({ nullable: true })
  alternative_number: string;

  @OneToOne(() => PaymentDetails, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  @JoinColumn()
  payment_details: PaymentDetails;

  @OneToMany(() => PaymentOption, (p) => p.contact)
  payment_option: PaymentOption[];

  @OneToMany(() => Invoice, (iv) => iv.contact)
  invoices: Invoice[];

  @BeforeInsert()
  updateDue() {
    if (this.customer_opening_balance) {
      this.due_from_supplier = this.customer_opening_balance;
    }

    if (this.supplier_opening_balance) {
      this.due_from_owner = this.supplier_opening_balance;
    }
  }
}
