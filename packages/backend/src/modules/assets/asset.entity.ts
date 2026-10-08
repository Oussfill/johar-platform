import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../users/user.entity";
import { Organization } from "../organizations/organization.entity";

@Entity("assets")
@Index(["ownerId"])
@Index(["status"])
@Index(["type"])
@Index(["currentLocationId"])
@Index(["createdAt"])
export class Asset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  joharId: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  subType: string;

  @Column("decimal", { precision: 20, scale: 8 })
  weight: number;

  @Column({ default: "g" })
  weightUnit: string;

  @Column({ nullable: true })
  purity: string;

  @Column({ nullable: true })
  karat: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  originCountry: string;

  @Column()
  ownerId: string;

  @Column({ nullable: true })
  custodianId: string;

  @Column({ nullable: true })
  currentLocationId: string;

  @Column({ default: "DRAFT" })
  status: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ nullable: true })
  description: string;

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "custodianId" })
  custodian: User;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: "currentLocationId" })
  currentLocation: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("asset_events")
@Index(["assetId"])
@Index(["actorId"])
@Index(["createdAt"])
export class AssetEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  assetId: string;

  @Column()
  eventType: string;

  @Column({ nullable: true })
  fromState: string;

  @Column({ nullable: true })
  toState: string;

  @Column({ nullable: true })
  actorId: string;

  @Column({ nullable: true })
  organizationId: string;

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "actorId" })
  actor: User;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("digital_passports")
@Index(["assetId"])
@Index(["verificationToken"], { unique: true })
@Index(["status"])
export class DigitalPassport {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  assetId: string;

  @Column()
  version: number;

  @Column({ nullable: true })
  qrCodeUrl: string;

  @Column({ nullable: true })
  nfcChipId: string;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ nullable: true })
  contentHash: string;

  @Column({ default: "ACTIVE" })
  status: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
