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
import { Asset } from "../assets/asset.entity";

@Entity("blockchain_events")
@Index(["entityType", "entityId"])
@Index(["assetId"])
@Index(["confirmationStatus"])
@Index(["createdAt"])
export class BlockchainEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  eventType: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({ nullable: true })
  assetId: string;

  @Column()
  contentHash: string;

  @Column({ nullable: true })
  networkTxId: string;

  @Column({ nullable: true })
  blockNumber: number;

  @Column({ default: "PENDING" })
  confirmationStatus: string;

  @Column({ nullable: true })
  network: string;

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any> | null;

  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: "assetId" })
  asset: Asset;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
