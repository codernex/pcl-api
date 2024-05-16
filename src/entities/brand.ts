import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Image } from "./image";
import { Product } from "./product";

@Entity()
export class Brand extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({nullable:true})
  description: string;

  @OneToMany(() => Product, (p) => p.brand)
  products: Product[];

  @OneToOne(() => Image, {eager:true,onDelete:"CASCADE"})
  @JoinColumn()
  image: Image;

  @Column({ default: false })
  isActive: boolean;
}
