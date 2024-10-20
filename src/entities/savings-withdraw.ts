import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Customer } from "./customer";

@Entity()
export class SavingsWithdraw {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type:"bigint"})
  amount: number;

  @ManyToOne(() => Customer, {
    cascade: true,
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  customer: Customer;

  @CreateDateColumn()
  created_at: Date;
}
