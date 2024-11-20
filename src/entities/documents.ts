import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Delivery, Project } from "./project";

@Entity()
export class Documents {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  name: string;

  @ManyToOne(() => Project, (p) => p.documents)
  project: Project;

  @ManyToOne(() => Delivery, (d) => d.documents)
  delivery: Delivery;
}
