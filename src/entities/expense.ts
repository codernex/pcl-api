import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

@Entity()
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  expenseName: string;

  @Column()
  amount: number;

  @Column()
  expenseType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
