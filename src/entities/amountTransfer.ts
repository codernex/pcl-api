import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Account } from "./account";

@Entity()
export class AmountTransfer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  amount: number;

  @Column({ default: 0 })
  cost: number;

  @ManyToOne(() => Account)
  @JoinColumn({
    name: "sender_id",
    referencedColumnName: "id",
  })
  sender: Account;

  @ManyToOne(() => Account)
  @JoinColumn({
    name: "reciever_id",
    referencedColumnName: "id",
  })
  reciever: Account;

  @CreateDateColumn()
  created_at: Date;
}
