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

  @ManyToOne(() => Contacts, { cascade: true, onUpdate: "CASCADE" })
  @JoinColumn()
  contact: Contacts;

  @ManyToMany(() => Product, (p) => p.purchase, {
    onUpdate: "CASCADE",
    cascade: true,
  })
  @JoinTable()
  products: Product[];

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

  @Column({ nullable: true})
  returned_at: string;

  addProduct(product: Product) {
    if (this.products == null) {
      this.products = new Array<Product>();
    }
    this.products.push(product);
  }
}
