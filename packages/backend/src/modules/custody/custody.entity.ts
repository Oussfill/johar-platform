import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Organization } from "../organizations/organization.entity";
import { User } from "../users/user.entity";
import { Asset } from "../assets/asset.entity";

@Entity("custody_vaults")
export class CustodyVault {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  supervisorId: string;

  @Column({ default: "ACTIVE" })
  status: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "supervisorId" })
  supervisor: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("custody_transfer_requests")
export class CustodyTransferRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  assetId: string;

  @Column()
  requesterId: string;

  @Column()
  fromVaultId: string;

  @Column()
  toVaultId: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ default: false })
  requiresDualAuth: boolean;

  @Column({ default: "PENDING" })
  status: string;

  @Column({ nullable: true })
  approverId: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @ManyToOne(() => User)
  @JoinColumn({ name: "requesterId" })
  requester: User;

  @ManyToOne(() => CustodyVault)
  @JoinColumn({ name: "fromVaultId" })
  fromVault: CustodyVault;

  @ManyToOne(() => CustodyVault)
  @JoinColumn({ name: "toVaultId" })
  toVault: CustodyVault;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "approverId" })
  approver: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}