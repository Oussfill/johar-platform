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

@Entity("password_resets")
@Index(["userId", "isUsed"])
@Index(["expiresAt"])
export class PasswordReset {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  tokenHash: string;

  @Column({ type: "timestamp" })
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true })
  usedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("email_verifications")
@Index(["userId", "isVerified"])
@Index(["expiresAt"])
export class EmailVerification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  tokenHash: string;

  @Column()
  email: string;

  @Column({ type: "timestamp" })
  expiresAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("mfa_devices")
@Index(["userId", "isActive"])
@Index(["userId", "type"])
export class MfaDevice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  type: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  secret: string;

  @Column({ nullable: true })
  publicKey: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastUsedAt: Date;

  @Column({ default: 0 })
  failedAttempts: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("otp_codes")
@Index(["userId", "purpose", "isUsed"])
@Index(["expiresAt"])
export class OtpCode {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  codeHash: string;

  @Column()
  purpose: string;

  @Column({ type: "timestamp" })
  expiresAt: Date;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
