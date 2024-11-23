import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Wastage } from "./wastage";

@Entity()
export class WastageProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  originalId: number;

  @Column()
  quantity: number;

  @ManyToMany(() => Wastage, (w) => w.products)
  wastages: Wastage[];
}
