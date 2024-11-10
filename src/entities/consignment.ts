import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Customer } from "./customer";
import { LcAgent } from "./lc-agents";
import { Port } from "./port";
import { Supplier } from "./supplier";
import { Track } from "./track";

export enum ConsignmentStatus {
  IN_TRANSIT = "IN_TRANSIT",
  PROCESSING = "PROCESSING",
  DELIVERY = "DELIVERY",
  FINALIZED = "FINALIZED",
  CANCELLED = "CANCELLED",
}

@Entity()
export class Consignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Port, { eager: true })
  port: Port;

  @ManyToOne(() => Customer, { eager: true })
  customer: Customer;

  @ManyToOne(() => Supplier, { eager: true })
  exporter: Supplier;

  @ManyToOne(() => LcAgent, { eager: true })
  lcAgent: LcAgent;

  @ManyToMany(() => Track, { eager: true })
  @JoinTable()
  tracks: Track[];

  @Column()
  manifestNumber: string;

  @Column()
  cNumber: string;

  @Column({
    type: "enum",
    enum: ConsignmentStatus,
    default: ConsignmentStatus.IN_TRANSIT,
  })
  status: ConsignmentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
