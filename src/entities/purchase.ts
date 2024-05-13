import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
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

export enum PurchaseStatus {
  PENDING = "PENDING",
  RECIVED = "RECIVED",
  CANCELLED = "CANCELLED",
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

  @ManyToOne(() => Contacts, { cascade: true, onUpdate: "CASCADE" })
  @JoinColumn()
  contact: Contacts;

  @OneToMany(() => Product, (p) => p.purchase,{onUpdate:"CASCADE"})
  products: Product[];

  @ManyToOne(() => Business, (b) => b.purchase, {
    cascade: true,
    onUpdate: "CASCADE",
  })
  business: Business;

  @OneToOne(() => PaymentOption, { cascade: true,onUpdate:"CASCADE" })
  payment: PaymentOption;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  addProduct(product: Product) {
    if (this.products == null) {
      this.products = new Array<Product>();
    }
    this.products.push(product);
  }
}
