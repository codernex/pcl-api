import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Contacts } from "./contacts";
@Entity()
export class PaymentOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @Column()
  type: string;

  @Column()
  reciver_id: number;

  @Column({nullable:true})
  recived_by: string;

  @ManyToOne(() => Contacts,c=>c.payment_option, { cascade: true, onUpdate: "CASCADE" })
  @JoinColumn({
    name:"contact_id",
    referencedColumnName:"id"
  })
  contact: Contacts;
}
