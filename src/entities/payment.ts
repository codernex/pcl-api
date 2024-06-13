import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class PaymentDetails extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ nullable: true })
  accountName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  swiftCode: string;

  @Column({ nullable: true })
  routingNumber: string;

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  primaryPaymentOption: string;

  @Column({ nullable: true })
  bkashNumber: string;

  @Column({ nullable: true })
  nagadNumber: string;

  @Column({ nullable: true })
  rocketNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
