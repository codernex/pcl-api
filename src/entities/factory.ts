import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product";
import { Production } from "./production";
import { Delivery } from "./project";
import { FactoryVolatileProduct } from "./FactoryVolatileProduct";
import { Wastage } from "./wastage";

@Entity()
export class Factory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @OneToMany(() => FactoryVolatileProduct, (p) => p.factory)
  factoryProducts: Product[];

  @OneToMany(() => Production, (p) => p.factory, { eager: true })
  productions: Production[];

  @OneToMany(() => Delivery, (d) => d.factory, { eager: true })
  deliveries: Delivery[];

  @OneToMany(()=>Wastage,w=>w.factory)
  wastages:Wastage[]

  @CreateDateColumn()
  createdAt: Date;
}
