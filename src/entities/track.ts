import {
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product";
import { VolatileProduct } from "./volatile-product";

@Entity()
export class Track {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  trackNumber: string;

  @Column()
  tierCount: string;

  @Column()
  initialGrossWeight: string;

  @Column({
    nullable: true,
  })
  scaleWeight: string;

  @Column({
    nullable: true,
  })
  netWeight: string;

  @Column({
    nullable: true,
  })
  savingWeight: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  customsCost: number;

  /**
   * Costings
   */
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  mCost: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  cfCharge: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  beOperator: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  cgA: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  cgdc: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  aConsNgo: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  cgdcExam: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  cgExamp: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  exampCons: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  fecngo: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  postAudit: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  frCharge: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  asasClerk: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  cgcic: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  ct: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  bankAndNgo: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  exitCustoms: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  exitPort: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  cgcN: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  cec: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  pcharge: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  be: number;
  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  serviceStff: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  serviceCost: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  savingCost: number;

  @Column({ nullable: true, default: 0 })
  packageCount: number;

  @ManyToMany(() => VolatileProduct, { eager: true, cascade: true })
  @JoinTable()
  products: VolatileProduct[];

  @OneToMany(() => OtherCost, (otherCost) => otherCost.track, {
    cascade: true,
    eager: true,
  })
  otherCosts: OtherCost[];

  @OneToMany(() => Documents, (document) => document.track, { eager: true })
  documents: Documents[];

  addProduct(product: VolatileProduct) {
    if (this.products == null) {
      this.products = new Array<VolatileProduct>();
    }
    this.products.push(product);
  }

  removeProduct(product: VolatileProduct) {
    if (this.products == null) {
      this.products = new Array<VolatileProduct>();
    }
    this.products = this.products.filter((p) => p.id !== product.id);
  }

}

@Entity()
export class OtherCost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value) => value?.toString(),
      from: (v) => parseFloat(v),
    },
    nullable: true,
    default: 0,
  })
  amount: number;

  @Column()
  name: string;

  @ManyToOne(() => Track, (t) => t.otherCosts)
  track: Track;
}

@Entity()
export class Documents {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  url: string;

  @ManyToOne(() => Track, (t) => t.documents)
  track: Track;
}
