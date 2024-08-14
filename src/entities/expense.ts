import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ExpenseType } from "./expense-type";

@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  expenseName: string;

  @Column()
  amount: number;

  @ManyToOne(() => ExpenseType, (et) => et.expenses, {
    cascade: true,
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  expenseType: ExpenseType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
