import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Customer } from "./customer";
import { Invoice } from "./invoice";

@Entity()
export class Seasonal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @Column({default:0})
  actual_amount: number;

  @Column()
  date: string;

  @ManyToOne(() => Customer, (customer) => customer.seasonal, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  customer: Customer;

  @ManyToOne(() => Invoice, (iv) => iv.seasonals, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  invoice: Invoice;

  @Column({ default: false })
  paid: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
