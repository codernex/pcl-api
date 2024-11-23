import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "./project";
import { VolatileProduct } from "./volatile-product";

@Entity()
export class Slot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Project, (p) => p.slots)
  project: Project;

  @OneToMany(() => VolatileProduct, (p) => p.slot, {
    eager: true,
  })
  products: VolatileProduct[];

  @CreateDateColumn()
  createdAt: Date;
}
