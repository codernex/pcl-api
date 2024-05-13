import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product";
@Entity()
export class Unit {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({unique:true})
  name: string;

  @Column({unique:true})
  shortName: string;

  @Column()
  description: string;

  @OneToMany(()=>Product,p=>p.unit)
  products:Product[]

  @Column({ default: false })
  isActive: boolean;
}
