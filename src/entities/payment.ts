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

    @Column()
    bankName: string;

    @Column()
    branchName: string;

    @Column()
    accountName: string;

    @Column()
    accountNumber: string;

    @Column()
    swiftCode: string;

    @Column()
    routingNumber: string;

    @Column()
    mobile: string;

    @Column()
    primaryPaymentOption: string;

    @Column()
    bkashNumber: string;

    @Column()
    nagadNumber: string;

    @Column()
    rocketNumber: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
