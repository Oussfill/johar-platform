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

@Entity("kyc_profiles")
export class KycProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  organizationId: string;

  @Column({ default: "PENDING" })
  status: string;

  @Column({ default: "L1" })
  level: string;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("kyc_documents")
export class KycDocument {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  kycProfileId: string;

  @Column()
  documentType: string;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  fileHash: string;

  @Column({ default: "PENDING" })
  status: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @ManyToOne(() => KycProfile)
  @JoinColumn({ name: "kycProfileId" })
  kycProfile: KycProfile;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("compliance_checks")
export class ComplianceCheck {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column()
  checkType: string;

  @Column({ default: "PENDING" })
  status: string;

  @Column({ default: "LOW" })
  riskLevel: string;

  @Column({ nullable: true })
  result: string;

  @Column({ nullable: true })
  providerResponse: string;

  @Column({ nullable: true })
  performedBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
