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

  @Column()
  amount: number;

  @ManyToOne(() => IncomeType, {
    cascade: true,
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  incomeType: IncomeType;

  @CreateDateColumn()
  created_at: Date;
}
