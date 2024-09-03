import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PaymentOption } from "./paymentoption";
import { Purchase } from "./purchase";

@Entity()
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  address: string;

  @Column()
  company_name: string;
  @Column()
  mobile: string;
  @OneToMany(() => Purchase, (purchase) => purchase.supplier, {
    onUpdate: "CASCADE",
  })
  purchases: Purchase[];

  @Column({default:0})
  due: number;

  @OneToMany(() => PaymentOption, (paymentOption) => paymentOption.supplier, {
    onUpdate: "CASCADE",
  })
  paymentOptions: PaymentOption[];

  @CreateDateColumn()
  createdAt: Date;
}
