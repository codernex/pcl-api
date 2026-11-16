import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Customer } from "./customer";
import { User } from "./user";
import { CrmDeal } from "./crm-deal";

export enum CrmActivityType {
  CALL = "CALL",
  MEETING = "MEETING",
  EMAIL = "EMAIL",
  NOTE = "NOTE",
  PROPOSAL = "PROPOSAL",
  TASK = "TASK",
}

export enum CrmActivityStatus {
  PLANNED = "PLANNED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

@Entity()
export class CrmActivity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: CrmActivityType,
    default: CrmActivityType.CALL,
  })
  type: CrmActivityType;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: CrmActivityStatus,
    default: CrmActivityStatus.COMPLETED,
  })
  status: CrmActivityStatus;

  @Column({ type: "datetime", nullable: true })
  dueDate?: Date | null;

  @Column({ type: "datetime", nullable: true })
  completedAt?: Date | null;

  @ManyToOne(() => CrmDeal, (deal) => deal.activities, {
    onDelete: "CASCADE",
    nullable: true,
  })
  deal?: CrmDeal | null;

  @ManyToOne(() => Customer, { onDelete: "SET NULL", nullable: true })
  customer?: Customer | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  user?: User | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
