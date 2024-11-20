import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity()
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  address: string;

  @Column()
  company_name: string;
  @Column()
  mobile: string;

  @Column({default:0})
  due: number;

  @CreateDateColumn()
  createdAt: Date;
}
