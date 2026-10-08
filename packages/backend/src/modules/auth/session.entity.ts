import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../users/user.entity";
import { Organization } from "../organizations/organization.entity";

@Entity("sessions")
@Index(["userId", "isActive"])
@Index(["expiresAt"])
@Index(["createdAt"])
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  organizationId: string;

  @Column()
  refreshTokenHash: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  deviceFingerprint: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;
}
