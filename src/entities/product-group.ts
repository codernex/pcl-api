import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product";

@Entity()
export class ProductGroup {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({unique:true})
  name: string;

  @Column()
  description: string;

  @OneToMany(()=>Product,p=>p.productGroup)
  products:Product[]

  @Column({ default: false })
  isActive: boolean;
}
