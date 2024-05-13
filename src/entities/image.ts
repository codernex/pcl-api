import {BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Product} from "./product";

@Entity()
export class Image extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  filename?: string;

  @Column({ nullable: true })
  originalname?: string;

  @Column({ nullable: true })
  path?: string;

  @Column({ nullable: true })
  destination?: string;

  @Column({ nullable: true })
  mimetype?: string;

  @Column({ nullable: true, type: "int" })
  size: number;

  @ManyToOne(() => Product, (product) => product.images,{
    onDelete:"CASCADE",
    onUpdate:"CASCADE"
  })
  product: Product;

}
