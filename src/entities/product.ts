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
import { Warehouse } from "./warehouse";
import { StockTransfer } from "./stock-transfer";

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

  @ManyToOne(() => Warehouse, (w) => w.products, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    nullable: true,
  })
  warehouse: Warehouse | null;

  @ManyToOne(() => Business, (b) => b.products, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    nullable: true,
  })
  business: Business | null;

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

  @ManyToMany(() => Purchase, (p) => p.products, {
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  purchase: Purchase[];

  @ManyToMany(() => StockTransfer, (s) => s.products, {
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  })
  stock_transfer: StockTransfer[];

  @Column({ nullable: true })
  sku_id: string;

  @Column({ nullable: true, type: "longtext" })
  description: string;

  @Column({ default: false })
  is_returned_supplier: boolean;

  @Column({ default: false })
  is_returned: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, default: 0 })
  warehouseQty: number;

  addColor(color: Color) {
    if (this.colors == null) {
      this.colors = new Array<Color>();
    }
    this.colors.push(color);
  }
}
