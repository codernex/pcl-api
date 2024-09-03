import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product";
import { Image } from "./image";
import { Brand } from "./brand";

@Entity()
export class Model {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Brand, (b) => b.models, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  @JoinTable()
  brands: Brand[];

  @OneToOne(() => Image, { cascade: true, eager: true, onDelete: "CASCADE" })
  @JoinColumn()
  image: Image;

  @OneToMany(() => Product, (p) => p.model)
  products: Product[];

  @Column({ default: false })
  isActive: boolean;

  addBrand(brand: Brand) {
    if (this.brands == null) {
      this.brands = new Array<Brand>();
    }
    this.brands.push(brand);
  }
}
