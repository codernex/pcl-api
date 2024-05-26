import {
  BaseEntity,
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
import { Category } from "./category";
import { Model } from "./model";

@Entity()
export class Brand extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Category, (c) => c.brand, {
    eager: true,
  })
  categories: Category[];

  @OneToMany(() => Product, (p) => p.brand)
  products: Product[];

  @ManyToOne(() => Model, (m) => m.brands,{onDelete:"RESTRICT"})
  models: Model;

  @OneToOne(() => Image, { eager: true, onDelete: "CASCADE" })
  @JoinColumn()
  image: Image;

  @Column({ default: false })
  isActive: boolean;

  addCategory(category: Category) {
    if (this.categories == null) {
      this.categories = new Array<Category>();
    }
    this.categories.push(category);
  }
}
