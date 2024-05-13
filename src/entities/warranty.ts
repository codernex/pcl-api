import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product";
@Entity()
export class Warranty {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  name?: string;

  @Column()
  duration: string;

  @Column()
  description: string;

  @OneToMany(()=>Product,p=>p.warranty)
  products:Product[]

  @Column({ default: false })
  isActive: boolean;
}
