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

  @Column({ type: "bigint" })
  amount: number;

  @ManyToOne(() => ExpenseType, (et) => et.expenses, {
    cascade: true,
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
    eager: true,
  })
  expenseType: ExpenseType;

  @Column({ nullable: true, type: "longtext" })
  details: string;

  @Column({ nullable: true, type: "longtext" })
  attachment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
