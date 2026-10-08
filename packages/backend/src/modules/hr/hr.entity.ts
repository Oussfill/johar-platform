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

@Entity("worker_types")
export class WorkerType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  baseRate: number;

  @Column({ nullable: true })
  unit: string;

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

@Entity("workers")
export class Worker {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  workerTypeId: string;

  @Column({ unique: true })
  workerCode: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: "ACTIVE" })
  status: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => WorkerType)
  @JoinColumn({ name: "workerTypeId" })
  workerType: WorkerType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("attendance_records")
export class AttendanceRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  workerId: string;

  @Column({ type: "date" })
  date: string;

  @Column("float", { default: 0 })
  hours: number;

  @Column({ default: "PRESENT" })
  type: string;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => Worker)
  @JoinColumn({ name: "workerId" })
  worker: Worker;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("salary_payments")
export class SalaryPayment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  workerId: string;

  @Column()
  periodLabel: string;

  @Column("decimal", { precision: 20, scale: 2 })
  baseAmount: number;

  @Column("decimal", { precision: 20, scale: 2, default: 0 })
  bonuses: number;

  @Column("decimal", { precision: 20, scale: 2, default: 0 })
  deductions: number;

  @Column("decimal", { precision: 20, scale: 2 })
  netAmount: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ default: "PENDING" })
  status: string;

  @Column({ nullable: true })
  paidAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => Worker)
  @JoinColumn({ name: "workerId" })
  worker: Worker;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}