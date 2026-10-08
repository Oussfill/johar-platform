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

@Entity("laboratories")
export class Laboratory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  nameAr: string;

  @Column({ unique: true })
  registrationNumber: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column("simple-array", { nullable: true })
  accreditations: string[];

  @Column({ default: "ACTIVE" })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("assay_requests")
export class AssayRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  assetId: string;

  @Column()
  laboratoryId: string;

  @Column()
  requestedBy: string;

  @Column()
  assayType: string;

  @Column({ default: "PENDING" })
  status: string;

  @Column({ nullable: true })
  sampleCondition: string;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @ManyToOne(() => Laboratory)
  @JoinColumn({ name: "laboratoryId" })
  laboratory: Laboratory;

  @ManyToOne(() => User)
  @JoinColumn({ name: "requestedBy" })
  requester: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("assay_results")
export class AssayResult {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  assayRequestId: string;

  @Column({ nullable: true })
  performedBy: string;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column("jsonb")
  result: Record<string, any>;

  @Column({ default: "DRAFT" })
  status: string;

  @Column({ nullable: true })
  certificateHash: string;

  @Column({ nullable: true })
  certificateUrl: string;

  @ManyToOne(() => AssayRequest)
  @JoinColumn({ name: "assayRequestId" })
  assayRequest: AssayRequest;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
