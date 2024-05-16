import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Brand } from "./brand";
import { Business } from "./business";
import { Category } from "./category";
import { Color } from "./color";
import { Image } from "./image";
import { Model } from "./model";
import { ProductGroup } from "./product-group";
import { Purchase } from "./purchase";
import { Unit } from "./unit";
import { Warranty } from "./warranty";

export enum ProductType {
  BARCODE = "BARCODE",
  NON_BARCODE = "NON_BARCODE",
}

@Entity()
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true, type: "enum", enum: ProductType })
  product_type: ProductType;

  @Column({ nullable: true })
  alert_quantity: number;

  @Column()
  name: string;

  @ManyToOne(() => Model, (m) => m.products, {
    eager: true,
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  model: Model;

  @ManyToOne(() => Category, (c) => c.products, {
    cascade: true,
    eager: true,
    onUpdate: "CASCADE",
  })
  category: Category;

  @ManyToOne(() => ProductGroup, (u) => u.products, {
    eager: true,
    cascade: true,
    onUpdate: "CASCADE",
  })
  productGroup: ProductGroup;

  @ManyToOne(() => Brand, (u) => u.products, {
    eager: true,
    cascade: true,
    onUpdate: "CASCADE",
  })
  brand: Brand;

  @ManyToOne(() => Warranty, (w) => w.products, {
    eager: true,
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  warranty: Warranty | null;

  @ManyToMany(() => Color, (c) => c.products, {
    eager: true,
  })
  @JoinTable()
  colors: Color[];

  @ManyToOne(() => Unit, (u) => u.products, {
    cascade: true,
    eager: true,
    onUpdate: "CASCADE",
  })
  unit: Unit;

  @OneToMany(() => Image, (image) => image.product, {
    eager: true,
    cascade: true,
  })
  images: Image[];

  @ManyToOne(() => Business, (b) => b.products, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  business: Business;

  @Column({ type: "double", nullable: true, default: 0 })
  purchase_price: number;

  @Column({ type: "double", nullable: true, default: 0 })
  selling_price: number;

  @Column({ nullable: true, type: "double", default: 0 })
  selling_price_after_discount: number;

  @Column({ nullable: true, default: 0 })
  quantity: number;

  @Column({ default: false })
  isActive: boolean;

  @ManyToOne(() => Purchase, (p) => p.products, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
    nullable: true,
  })
  purchase: Purchase;

  @Column({ nullable: true })
  sku_id: string;

  @Column({ nullable: true, type: "longtext" })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  udpatedAt: Date;

  addColor(color: Color) {
    if (this.colors == null) {
      this.colors = new Array<Color>();
    }
    this.colors.push(color);
  }
}
