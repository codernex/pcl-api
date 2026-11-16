import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Customer } from "./customer";
import { User } from "./user";
import { CrmActivity } from "./crm-activity";

export enum CrmDealStage {
  LEAD = "LEAD",
  QUALIFIED = "QUALIFIED",
  PROPOSAL = "PROPOSAL",
  NEGOTIATION = "NEGOTIATION",
  WON = "WON",
  LOST = "LOST",
}

export enum CrmDealPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum CrmDealSource {
  DIRECT_SALES = "DIRECT_SALES",
  REFERRAL = "REFERRAL",
  WEBSITE = "WEBSITE",
  TRADE_SHOW = "TRADE_SHOW",
  COLD_CALL = "COLD_CALL",
  OTHER = "OTHER",
}

@Entity()
export class CrmDeal extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "bigint",
    default: 0,
    transformer: {
      to: (v: number | string) => (v ? v.toString() : "0"),
      from: (v: string) => parseInt(v, 10) || 0,
    },
  })
  value: number;

  @Column({
    type: "enum",
    enum: CrmDealStage,
    default: CrmDealStage.LEAD,
  })
  stage: CrmDealStage;

  @Column({
    type: "enum",
    enum: CrmDealPriority,
    default: CrmDealPriority.MEDIUM,
  })
  priority: CrmDealPriority;

  @Column({ type: "int", default: 20 })
  probability: number;

  @Column({
    type: "enum",
    enum: CrmDealSource,
    default: CrmDealSource.DIRECT_SALES,
  })
  source: CrmDealSource;

  @Column({ type: "date", nullable: true })
  expectedCloseDate: string;

  @Column({ type: "date", nullable: true })
  actualCloseDate: string;

  @ManyToOne(() => Customer, { onDelete: "SET NULL", nullable: true })
  customer?: Customer | null;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  companyName: string;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  assignedTo?: User | null;

  @Column({ nullable: true })
  lostReason: string;

  @OneToMany(() => CrmActivity, (activity) => activity.deal, { cascade: true })
  activities: CrmActivity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
