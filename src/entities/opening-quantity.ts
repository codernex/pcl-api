import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Factory } from "./factory";
import { Product } from "./product";

@Entity()
export class OpeningQuantity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    transformer: {
      from: (v) => parseInt(v),
      to: (v) => parseInt(v),
    },
  })
  quantity: number;

  @ManyToOne(()=>Product,f=>f.openingQuantity)
  product:Product

  @ManyToOne(() => Factory)
  @JoinColumn()
  factory: Factory;

  @CreateDateColumn()
  createdAt: Date;
}
