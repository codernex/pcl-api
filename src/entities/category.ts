import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Image } from "./image";
import { Product } from "./product";
import { Brand } from "./brand";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => Image, { eager: true, onDelete: "CASCADE" })
  @JoinColumn()
  image: Image;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  productGroup: string;

  @ManyToOne(() => Brand, (b) => b.categories, {onDelete:"CASCADE"})
  brand: Brand;

  @OneToMany(() => Product, (p) => p.category)
  products: Product[];

  @Column({ default: false })
  isActive: boolean;
}
