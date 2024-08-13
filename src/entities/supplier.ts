import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PaymentDetails } from "./payment";
import { Purchase } from "./purchase";
import { PaymentOption } from "./paymentoption";

@Entity()
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  address: string;

  @Column()
  company_name: string;

  @Column()
  mobile: string;

  @Column({ nullable: true })
  alternative_name: string;

  @Column({ nullable: true })
  alternative_mobile: string;

  @OneToOne(() => PaymentDetails, { cascade: true })
  @JoinColumn()
  payment_details: PaymentDetails;

  @OneToMany(() => Purchase, (purchase) => purchase.supplier, {
    onUpdate: "CASCADE",
  })
  purchases: Purchase[];

  @OneToMany(() => PaymentOption, (paymentOption) => paymentOption.supplier, {
    onUpdate: "CASCADE",
  })
  paymentOptions: PaymentOption[];

  @CreateDateColumn()
  createdAt: Date;
}
