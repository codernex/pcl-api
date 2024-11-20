import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "./project";

@Entity()
export class VolatileProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  originalId: number;

  @Column()
  name:string

  @Column()
  unitRate: number;

  @Column()
  quantity: number;

  @Column({default:0})
  deliveredQuantity: number;

  @ManyToOne(() => Project,p=>p.products)
  project: Project
}
