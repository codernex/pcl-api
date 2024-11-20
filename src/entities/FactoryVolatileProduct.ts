import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Factory } from "./factory";

@Entity()
export class FactoryVolatileProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  originalId: number;

  @Column({
    transformer: {
      to: (v) => parseInt(v),
      from: (v) => parseInt(v),
    },
  })
  stock: number;

  @ManyToOne(()=>Factory,f=>f.factoryProducts)
  factory:Factory
}
