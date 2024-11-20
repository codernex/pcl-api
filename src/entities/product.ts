import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "./project";
import { Factory } from "./factory";
import { OpeningQuantity } from "./opening-quantity";
import { Production } from "./production";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: "longtext" })
  description: string;

  @ManyToOne(() => Project)
  project: Project;

  @OneToMany(() => Production, (p) => p.product)
  productions: Production[];

  @OneToMany(() => OpeningQuantity, (f) => f.product, {
    eager: true,
  })
  openingQuantity: OpeningQuantity[];

  @Column({
    default: 0,
    transformer: {
      from: (v) => parseInt(v),
      to: (v) => parseInt(v),
    },
  })
  stock: number;

  @CreateDateColumn()
  created_at: Date;
}
