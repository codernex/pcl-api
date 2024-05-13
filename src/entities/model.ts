import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product";
import { Image } from "./image";

@Entity()
export class Model {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({unique:true})
  name: string;

  @Column()
  description: string;

  @Column()
  productGroup: string;

  @Column()
  brand: string;

  @Column()
  category: string;

  @OneToOne(()=>Image,{cascade:true,eager:true,onDelete:"CASCADE"})
  @JoinColumn()
  image:Image

  @OneToMany(() => Product, (p) => p.model)
  products:Product[]
  
  @Column({ default: false })
  isActive: boolean;
}
