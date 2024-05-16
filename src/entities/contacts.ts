import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PaymentDetails } from "./payment";
import { PaymentOption } from "./paymentoption";
import { Invoice } from "./invoice";

@Entity()
export class Contacts {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  mobile: string;

  @Column()
  email: string;

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
  payment: PaymentDetails;

  @OneToMany(() => PaymentOption, (p) => p.contact)
  payment_option: PaymentOption[];

  @OneToMany(() => Invoice, (iv) => iv.contact)
  invoices: Invoice[];
}
