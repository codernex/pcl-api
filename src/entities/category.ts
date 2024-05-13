import {
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
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => Image, { eager: true, onDelete: "CASCADE" })
  @JoinColumn()
  image: Image;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column()
  productGroup: string;

  @Column()
  brand: string;

  @Column({ type: "double", nullable: true })
  commission: number;

  @OneToMany(() => Product, (p) => p.category)
  products: Product[];

  @Column({ default: false })
  isActive: boolean;
}
