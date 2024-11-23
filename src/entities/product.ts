import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import { OpeningQuantity } from "./opening-quantity";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: "longtext" })
  description: string;

  @OneToMany(() => OpeningQuantity, (f) => f.product, {
    eager: true,
  })
  openingQuantity: OpeningQuantity[];

  @Column({
    default: 0,
    transformer: {
      from: (v) => parseInt(v),
      to: (v) => parseInt(v),
    },
  })
  stock: number;

  @CreateDateColumn()
  created_at: Date;
}
