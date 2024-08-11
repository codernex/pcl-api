import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Customer } from "./customer";

@Entity()
export class Granter extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  husband_or_parent_name: string;

  @Column()
  mobile: string;

  @Column({ nullable: true })
  present_address: string;

  @Column({ nullable: true })
  permanent_address: string;

  @Column({ nullable: true })
  religion: string;

  @Column({ nullable: true })
  nid: string;

  @Column({ nullable: true })
  profession: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  alternative_name: string;

  @Column({ nullable: true })
  alternative_number: string;

  @ManyToOne(() => Customer, (c) => c.granter, {
    cascade: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  customer: Customer;
}
