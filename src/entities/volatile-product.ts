import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Project } from "./project";
import { Slot } from "./slot";

@Entity()
export class VolatileProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  originalId: number;

  @Column()
  name: string;

  @Column()
  unitRate: number;

  @Column()
  quantity: number;

  @Column({ default: 0 })
  deliveredQuantity: number;

  @Column({ default: 0 })
  pendingQuantity: number;

  @ManyToOne(() => Slot, (p) => p.products)
  slot: Slot;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
