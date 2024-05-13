import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product";
import { User } from "./user";
import { Purchase } from "./purchase";

@Entity()
export class Business {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Product, (p) => p.business)
  products: Product[];

  @OneToMany(() => User, (u) => u.business)
  users: User[];

  @OneToMany(() => Purchase, (p) => p.business)
  purchase: Purchase[];
}
