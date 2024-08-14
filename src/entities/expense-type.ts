import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Expense } from "./expense";

@Entity("expense_types")
export class ExpenseType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @OneToMany(() => Expense, (expense) => expense.expenseType, {
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  })
  expenses: Expense[];
}
