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

@Entity("erp_suppliers")
export class ErpSupplier {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  country: string;

  @Column({ default: "ACTIVE" })
  status: string;

  @Column({ nullable: true })
  rating: number;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("crm_customers")
export class CrmCustomer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  segment: string;

  @Column({ default: "ACTIVE" })
  status: string;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("crm_interactions")
export class CrmInteraction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  customerId: string;

  @Column({ default: "OTHER" })
  type: string;

  @Column()
  summary: string;

  @Column({ nullable: true })
  nextAction: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => CrmCustomer)
  @JoinColumn({ name: "customerId" })
  customer: CrmCustomer;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("crm_opportunities")
export class CrmOpportunity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  customerId: string;

  @Column()
  title: string;

  @Column("decimal", { precision: 20, scale: 2 })
  value: number;

  @Column({ default: "LEAD" })
  stage: string;

  @Column({ default: 10 })
  probability: number;

  @Column({ nullable: true })
  closeDate: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => CrmCustomer)
  @JoinColumn({ name: "customerId" })
  customer: CrmCustomer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("purchase_requests")
export class PurchaseRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  requestedBy: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column("decimal", { precision: 20, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ default: "DRAFT" })
  status: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: "requestedBy" })
  requester: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("rfqs")
export class Rfq {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: "DRAFT" })
  status: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("rfq_offers")
export class RfqOffer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  rfqId: string;

  @Column()
  organizationId: string;

  @Column()
  supplierId: string;

  @Column("decimal", { precision: 20, scale: 2 })
  price: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ nullable: true })
  deliveryDays: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: false })
  chosen: boolean;

  @ManyToOne(() => Rfq)
  @JoinColumn({ name: "rfqId" })
  rfq: Rfq;

  @ManyToOne(() => ErpSupplier)
  @JoinColumn({ name: "supplierId" })
  supplier: ErpSupplier;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("purchase_orders")
export class PurchaseOrder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  supplierId: string;

  @Column()
  itemDescription: string;

  @Column({ nullable: true })
  quantity: number;

  @Column("decimal", { precision: 20, scale: 2, nullable: true })
  unitPrice: number;

  @Column("decimal", { precision: 20, scale: 2 })
  total: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ default: "DRAFT" })
  status: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("goods_receipts")
export class GoodsReceipt {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  purchaseOrderId: string;

  @Column()
  receivedBy: string;

  @Column()
  quantityReceived: number;

  @Column({ default: "OK" })
  condition: string;

  @Column({ default: "PENDING" })
  status: string;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: "purchaseOrderId" })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => User)
  @JoinColumn({ name: "receivedBy" })
  receiver: User;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity("sales_orders")
export class SalesOrder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  customerId: string;

  @Column()
  itemDescription: string;

  @Column({ nullable: true })
  quantity: number;

  @Column("decimal", { precision: 20, scale: 2, nullable: true })
  unitPrice: number;

  @Column("decimal", { precision: 20, scale: 2 })
  total: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ default: "DRAFT" })
  status: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => CrmCustomer, { nullable: true })
  @JoinColumn({ name: "customerId" })
  customer: CrmCustomer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("sales_invoices")
export class SalesInvoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  salesOrderId: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column("decimal", { precision: 20, scale: 2 })
  amount: number;

  @Column({ default: "USD" })
  currency: string;

  @Column({ default: "DRAFT" })
  status: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organizationId" })
  organization: Organization;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: "salesOrderId" })
  salesOrder: SalesOrder;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}