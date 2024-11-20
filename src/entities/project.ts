import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Costing } from "./costing";
import { Customer } from "./customer";
import { Documents } from "./documents";
import { Payment } from "./paymentoption";
import { PlanProject } from "./plan-project";
import { Production } from "./production";
import { VolatileProduct } from "./volatile-product";
import { Factory } from "./factory";

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  projectName: string;

  @ManyToOne(() => Customer, { eager: true })
  customer: Customer;

  @OneToMany(() => VolatileProduct, (p) => p.project, {
    eager: true,
  })
  products: VolatileProduct[];

  @OneToMany(() => Costing, (c) => c.project, {
    eager: true,
  })
  costings: Costing[];

  @Column()
  quantity: number;

  @Column({
    type: "bigint",
    transformer: {
      to: (value: BigInt) => value.toString(), // Store as string in database
      from: (value: string) => Number(value), // Convert from string to BigInt when retrieving from database
    },
  })
  totalAmount: number;

  @Column({
    type: "bigint",
    transformer: {
      to: (value: BigInt) => value.toString(),
      from: (value: string) => Number(value),
    },
  })
  paidAmount: number;

  @Column({
    type: "bigint",
    transformer: {
      to: (value: BigInt) => value.toString(),
      from: (value: string) => Number(value),
    },
  })
  dueAmount: number;

  @Column({ nullable: true })
  address: string;

  @OneToMany(() => PlanProject, (p) => p.project)
  planProject: PlanProject[];

  @OneToMany(() => Payment, (p) => p.project, {
    eager: true,
  })
  payments: Payment[];

  @OneToMany(() => Production, (p) => p.project, {
    eager: true,
  })
  productions: Production[];

  @OneToMany(() => Delivery, (d) => d.project, {
    eager: true,
    cascade: true,
    onDelete: "CASCADE",
  })
  deliveries: Delivery[];

  @OneToMany(() => Documents, (d) => d.project, {
    eager: true,
  })
  documents: Documents[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity()
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Project, (p) => p.deliveries)
  project: Project;

  @ManyToMany(() => VolatileProduct)
  @JoinTable({
    name: "delivery_products",
  })
  products: VolatileProduct[];

  @ManyToOne(() => Customer)
  @JoinColumn()
  customer: Customer;

  @Column({ nullable: true })
  challanNumber: string;

  @Column({ nullable: true })
  trackNumber: string;

  @Column({ default: "ON_THE_WAY" })
  status: string;

  @OneToMany(()=>Documents,(d)=>d.delivery,{
    eager:true
  })
  documents:Documents[]

  @ManyToOne(()=>Factory,f=>f.deliveries)
  factory:Factory

  @Column({nullable:true})
  url:string


  @CreateDateColumn()
  createAt: Date;
}
