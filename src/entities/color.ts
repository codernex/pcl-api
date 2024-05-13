import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product";

@Entity()
export class Color extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @ManyToMany(() => Product, (p) => p.colors, {
    onUpdate: "CASCADE",
    cascade: true,
  })
  products: Product[];

  @Column({ default: false })
  isActive: boolean;
}
