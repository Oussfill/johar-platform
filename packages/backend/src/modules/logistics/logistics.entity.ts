import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../users/user.entity";
import { Asset } from "../assets/asset.entity";
import { Organization } from "../organizations/organization.entity";

@Entity("warehouses")
export class Warehouse {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  nameAr: string;

  @Column()
  organizationId: string;

  @Column()
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: "STANDARD" })
  securityLevel: string;

  @Column({ default: "ACTIVE" })
  status: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("shipments")
export class Shipment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  trackingNumber: string;

  @Column()
  originWarehouseId: string;

  @Column()
  destinationWarehouseId: string;

  @Column({ nullable: true })
  carrierId: string;

  @Column({ default: "PREPARING" })
  status: string;

  @Column({ nullable: true })
  estimatedArrival: Date;

  @Column({ nullable: true })
  actualArrival: Date;

  @Column({ nullable: true })
  insuranceValue: number;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: "originWarehouseId" })
  originWarehouse: Warehouse;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: "destinationWarehouseId" })
  destinationWarehouse: Warehouse;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("custody_events")
export class CustodyEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  assetId: string;

  @Column()
  eventType: string;

  @Column({ nullable: true })
  fromCustodianId: string;

  @Column({ nullable: true })
  toCustodianId: string;

  @Column({ nullable: true })
  fromLocationId: string;

  @Column({ nullable: true })
  toLocationId: string;

  @Column({ nullable: true })
  authorizedById: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  signatureHash: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "authorizedById" })
  authorizedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
