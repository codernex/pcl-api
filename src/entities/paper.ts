import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Business } from "./business";

@Entity()
export class InvoicePaper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable:true,default:false})
  default:boolean

  @Column()
  name: string;

  @Column()
  width: string;

  @Column()
  height: string;

  @ManyToOne(() => Business)
  @JoinColumn()
  business: Business;
}
