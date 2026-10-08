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
import { Transaction } from "../marketplace/marketplace.entity";

@Entity("invoices")
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column()
  transactionId: string;

  @Column()
  issuerId: string;

  @Column()
  recipientId: string;

  @Column("decimal", { precision: 20, scale: 2 })
  subtotal: number;

  @Column("decimal", { precision: 20, scale: 2, default: 0 })
  tax: number;

  @Column("decimal", { precision: 20, scale: 2, default: 0 })
  fees: number;

  @Column("decimal", { precision: 20, scale: 2 })
  total: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ default: "DRAFT" })
  status: string;

  @Column({ nullable: true })
  dueDate: Date;

  @ManyToOne(() => Transaction)
  @JoinColumn({ name: "transactionId" })
  transaction: Transaction;

  @ManyToOne(() => User)
  @JoinColumn({ name: "issuerId" })
  issuer: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "recipientId" })
  recipient: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  paymentNumber: string;

  @Column()
  invoiceId: string;

  @Column()
  payerId: string;

  @Column("decimal", { precision: 20, scale: 2 })
  amount: number;

  @Column({ default: "USD" })
  currency: string;

  @Column()
  paymentMethod: string;

  @Column({ default: "PENDING" })
  status: string;

  @Column({ nullable: true })
  externalTransactionId: string;

  @Column({ nullable: true })
  providerResponse: string;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice;

  @ManyToOne(() => User)
  @JoinColumn({ name: "payerId" })
  payer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("ledger_entries")
export class LedgerEntry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  accountId: string;

  @Column()
  type: string;

  @Column("decimal", { precision: 20, scale: 2 })
  amount: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ nullable: true })
  referenceType: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
