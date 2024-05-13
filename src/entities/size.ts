import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Product } from "./product";

@Entity()
export class Size extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @ManyToMany(() => Product, (p) => p.sizes, {
    onUpdate: "CASCADE",
    cascade:true
  })
  products: Product[];

  @Column({ default: false })
  isActive: boolean;
}
