import {
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
import { Contacts } from "./contacts";
import { Business } from "./business";
import { PaymentOption } from "./paymentoption";
import { PurchasedCart } from "./purchased.cart";

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

  @Column()
  amount: number;

  @Column({ nullable: true })
  paid_amount: number;

  @ManyToOne(() => Contacts, { cascade: true, onUpdate: "CASCADE" })
  @JoinColumn()
  contact: Contacts;

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

  @OneToOne(() => PaymentOption, { cascade: true, onUpdate: "CASCADE" })
  payment: PaymentOption;

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
}
