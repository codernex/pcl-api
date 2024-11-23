import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Production } from "./production";

@Entity()
export class ProductionProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  quantity: number;

  @Column()
  originalId: number;

  @ManyToOne(() => Production, (p) => p.products)
  production: Production;

  @CreateDateColumn()
  createdAt: Date;
}
