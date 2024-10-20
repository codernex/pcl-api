import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { IncomeType } from "./income-type";

@Entity()
export class Income {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "bigint" })
  amount: number;

  @ManyToOne(() => IncomeType, {
    cascade: true,
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  incomeType: IncomeType;

  @Column({ default: 0 })
  cost: number;

  @CreateDateColumn()
  created_at: Date;
}
