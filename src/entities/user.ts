import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import {Role} from "./role";
import * as bcrypt from "bcryptjs";
import {Business} from "./business";

export enum UserRole {
    ADMIN = "admin",
    USER = "user"
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({unique: true})
    mobile: string

    @Column({nullable: true})
    username: string

    @Column({nullable: true, enum: UserRole, type: "enum", default: UserRole.USER})
    role: UserRole

    @ManyToOne(() => Role, {cascade: true, onUpdate: "CASCADE", onDelete: "RESTRICT", nullable: true})
    @JoinColumn({name: "access_id", referencedColumnName: "id", foreignKeyConstraintName: "user_access_fk"})
    access?: Role

    @ManyToOne(() => Business, b => b.users, {cascade: true, onUpdate: "CASCADE", onDelete: "RESTRICT", nullable: true})
    business: Business

    @Column({unique: true})
    email: string

    @Column()
    password: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @BeforeInsert()
    hashPassword() {
        this.password = bcrypt.hashSync(this.password, 10)
    }

}