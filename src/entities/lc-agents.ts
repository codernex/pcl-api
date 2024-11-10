import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class LcAgent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  companyName: string;

  @Column({unique:true})
  mobile: string;

  @Column()
  designation: string;

  @Column({ nullable: true })
  address: string;

  @CreateDateColumn()
  created_at: Date;
}
