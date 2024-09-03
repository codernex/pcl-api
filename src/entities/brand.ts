import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
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

  @ManyToMany(() => Category, (c) => c.brand, {
    eager:true,
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Model, (m) => m.brands, {
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  models: Model[];

  @OneToMany(() => Product, (p) => p.brand)
  products: Product[];

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
