import {
  Column,
  Entity,
  JoinColumn,
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

  @OneToMany(() => Brand, (b) => b.models, { eager: true })
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
