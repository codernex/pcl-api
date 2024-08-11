import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Product } from "./product";
import { Customer } from "./customer";
import { Business } from "./business";
import { PaymentOption } from "./paymentoption";
import { PurchasedCart } from "./purchased.cart";
import { Image } from "./image";
import { Supplier } from "./supplier";

export enum PurchaseStatus {
  PENDING = "PENDING",
  RECIVED = "RECIVED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

@Entity()
export class Purchase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
  })
  status: PurchaseStatus;

  @Column()
  quantity: number;

  @Column({ nullable: true, default: 0 })
  discount: number;

  @Column({ nullable: true, default: 0 })
  transport_cost: number;

  @Column({ nullable: true })
  due: number;

  @Column()
  amount: number;

  @Column({ nullable: true })
  total_amount: number;

  @Column({ nullable: true })
  paid_amount: number;

  @OneToOne(() => Image, { cascade: true, eager: true })
  @JoinColumn()
  memo: Image;

  @Column({ nullable: true })
  memo_sl: string;

  @ManyToOne(() => Customer, { cascade: true, onUpdate: "CASCADE" })
  @JoinColumn()
  contact: Customer;

  @ManyToMany(() => Product, (p) => p.purchase, {
    onUpdate: "CASCADE",
    cascade: true,
  })
  @JoinTable()
  products: Product[];

  @OneToMany(() => PurchasedCart, (p) => p.purchases, {
    onUpdate: "CASCADE",
    cascade: true,
    onDelete: "CASCADE",
    eager: true,
  })
  purchasedCart: PurchasedCart[];

  @ManyToOne(() => Business, (b) => b.purchase, {
    cascade: true,
    onUpdate: "CASCADE",
  })
  business: Business;

  @OneToOne(() => PaymentOption, {
    cascade: true,
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn()
  payment: PaymentOption;

  @ManyToOne(() => Supplier, (s) => s.purchases, {
    cascade: true,
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  supplier: Supplier;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  returned_at: string;

  addProduct(product: Product) {
    if (this.products == null) {
      this.products = new Array<Product>();
    }
    this.products.push(product);
  }

  addCart(cart: PurchasedCart) {
    if (this.purchasedCart == null) {
      this.purchasedCart = new Array<PurchasedCart>();
    }
    this.purchasedCart.push(cart);
  }

  @BeforeInsert()
  beforeInsert() {
    if (this.transport_cost) {
      this.total_amount = this.transport_cost + this.amount;
    }
  }
}
