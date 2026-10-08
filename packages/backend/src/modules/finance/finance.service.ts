import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Invoice, Payment, LedgerEntry } from "./finance.entity";
import { Transaction } from "../marketplace/marketplace.entity";
import { OrganizationMember } from "../organizations/organization-member.entity";
import { Asset } from "../assets/asset.entity";

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(LedgerEntry) private ledgerRepo: Repository<LedgerEntry>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(OrganizationMember) private memberRepo: Repository<OrganizationMember>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>
  ) {}

  private async getUserOrganizationId(userId: string): Promise<string | undefined> {
    const member = await this.memberRepo.findOne({ where: { userId } });
    return member?.organizationId;
  }

  private async getTransactionOrganizationId(transactionId: string): Promise<string | undefined> {
    const tx = await this.txRepo.findOne({ where: { id: transactionId } });
    if (!tx?.assetId) return undefined;
    const asset = await this.assetRepo.findOne({ where: { id: tx.assetId } });
    return asset?.currentLocationId;
  }

  private isGlobalAdmin(user: any): boolean {
    return user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
  }

  async assertCanAccessInvoice(invoice: Invoice, user: any): Promise<void> {
    if (this.isGlobalAdmin(user)) return;
    if (invoice.issuerId === user.id || invoice.recipientId === user.id) return;

    if (user?.roles?.includes("FINANCE_OFFICER")) {
      const issuerOrg = await this.getUserOrganizationId(invoice.issuerId);
      if (issuerOrg && issuerOrg === user.organizationId) return;
    }

    throw new ForbiddenException("Access denied");
  }

  private async assertTransactionInScope(transactionId: string, user: any): Promise<void> {
    const tx = await this.txRepo.findOne({ where: { id: transactionId } });
    if (!tx) throw new NotFoundException("Transaction not found");

    if (this.isGlobalAdmin(user)) return;
    if (tx.buyerId === user.id || tx.sellerId === user.id) return;

    if (user?.roles?.includes("FINANCE_OFFICER")) {
      const txOrg = await this.getTransactionOrganizationId(transactionId);
      if (txOrg && txOrg === user.organizationId) return;
    }

    throw new ForbiddenException("You are not a participant of this transaction");
  }

  async createInvoice(data: Partial<Invoice>, user: any): Promise<Invoice> {
    if (data.transactionId) {
      await this.assertTransactionInScope(data.transactionId, user);
    } else {
      throw new BadRequestException("transactionId is required");
    }

    const year = new Date().getFullYear();

    const result = await this.invoiceRepo.manager.transaction(async (tm) => {
      const last = await tm
        .createQueryBuilder(Invoice, "inv")
        .where("inv.invoiceNumber LIKE :pattern", { pattern: `INV-${year}-%` })
        .setLock("pessimistic_write")
        .orderBy("inv.invoiceNumber", "DESC")
        .getOne();

      let seq = 1;
      if (last) {
        const parts = last.invoiceNumber.split("-");
        seq = parseInt(parts[2], 10) + 1;
      }

      const invoiceNumber = `INV-${year}-${String(seq).padStart(4, "0")}`;

      const invoice = tm.create(Invoice, {
        ...data,
        invoiceNumber,
        status: "DRAFT",
      });
      return tm.save(Invoice, invoice);
    });

    this.logger.log(`Invoice created: ${result.invoiceNumber}`);
    return result;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ["transaction"],
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  async listInvoices(
    page = 1,
    limit = 20,
    organizationId?: string
  ): Promise<{ data: Invoice[]; total: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const where: any = {};
    if (organizationId) {
      const members = await this.memberRepo.find({ where: { organizationId } });
      const userIds = members.map((member) => member.userId);
      if (userIds.length === 0) {
        return { data: [], total: 0 };
      }
      where.issuerId = In(userIds);
    }

    const [data, total] = await this.invoiceRepo.findAndCount({
      where,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      order: { createdAt: "DESC" },
    });
    return { data, total };
  }

  async listByUser(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: Invoice[]; total: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const [data, total] = await this.invoiceRepo.findAndCount({
      where: [{ issuerId: userId }, { recipientId: userId }],
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      order: { createdAt: "DESC" },
    });
    return { data, total };
  }

  async recordPayment(
    invoiceId: string,
    data: Partial<Payment>,
    user: any
  ): Promise<Payment> {
    const invoice = await this.getInvoice(invoiceId);
    await this.assertCanAccessInvoice(invoice, user);

    if (!data.amount || data.amount <= 0) {
      throw new BadRequestException("Payment amount must be positive");
    }

    const result = await this.invoiceRepo.manager.transaction(async (tm) => {
      const year = new Date().getFullYear();
      const last = await tm
        .createQueryBuilder(Payment, "pay")
        .where("pay.paymentNumber LIKE :pattern", { pattern: `PAY-${year}-%` })
        .setLock("pessimistic_write")
        .orderBy("pay.paymentNumber", "DESC")
        .getOne();

      let seq = 1;
      if (last) {
        const parts = last.paymentNumber.split("-");
        seq = parseInt(parts[2], 10) + 1;
      }

      const paymentNumber = `PAY-${year}-${String(seq).padStart(4, "0")}`;

      const payment = tm.create(Payment, {
        ...data,
        invoiceId,
        paymentNumber,
        status: "PROCESSING",
      });
      const saved = await tm.save(Payment, payment);

      const paymentAmount = data.amount || invoice.total;

      await tm.save(LedgerEntry, {
        accountId: `invoice:${invoiceId}`,
        type: "DEBIT",
        amount: paymentAmount,
        currency: data.currency || invoice.currency,
        referenceType: "invoice",
        referenceId: invoiceId,
      });

      await tm.save(LedgerEntry, {
        accountId: `payment:${saved.id}`,
        type: "CREDIT",
        amount: paymentAmount,
        currency: data.currency || invoice.currency,
        referenceType: "payment",
        referenceId: saved.id,
      });

      return saved;
    });

    this.logger.log(`Payment recorded: ${result.paymentNumber} for invoice ${invoice.invoiceNumber}`);
    return result;
  }

  async confirmPayment(paymentId: string, user: any): Promise<Payment> {
    const result = await this.paymentRepo.manager.transaction(async (tm) => {
      const payment = await tm.findOne(Payment, {
        where: { id: paymentId },
        lock: { mode: "pessimistic_write" },
      });
      if (!payment) throw new NotFoundException("Payment not found");

      if (payment.status === "COMPLETED") {
        throw new BadRequestException("Payment already confirmed");
      }

      if (payment.status === "FAILED" || payment.status === "CANCELLED") {
        throw new BadRequestException(`Cannot confirm payment in ${payment.status} status`);
      }

      const invoice = await tm.findOne(Invoice, {
        where: { id: payment.invoiceId },
      });
      if (!invoice) throw new NotFoundException("Invoice not found");

      if (!this.isGlobalAdmin(user)) {
        const issuerOrg = await this.getUserOrganizationId(invoice.issuerId);
        if (!issuerOrg || issuerOrg !== user.organizationId) {
          throw new ForbiddenException("Access denied: cross-tenant payment confirmation prohibited");
        }
      }

      payment.status = "COMPLETED";
      const saved = await tm.save(Payment, payment);

      const totalPaid = await tm
        .createQueryBuilder(Payment, "pay")
        .where("pay.invoiceId = :invoiceId", { invoiceId: invoice.id })
        .andWhere("pay.status = :status", { status: "COMPLETED" })
        .select("COALESCE(SUM(pay.amount), 0)", "total")
        .getRawOne();

      const paidAmount = Number(totalPaid?.total || 0);
      const invoiceTotal = Number(invoice.total);

      if (paidAmount >= invoiceTotal) {
        invoice.status = "PAID";
      } else if (paidAmount > 0) {
        invoice.status = "PARTIAL";
      }

      await tm.save(Invoice, invoice);

      return saved;
    });

    this.logger.log(`Payment confirmed: ${result.paymentNumber}`);
    return result;
  }

  async getPaymentsByInvoice(invoiceId: string, user: any): Promise<Payment[]> {
    const invoice = await this.getInvoice(invoiceId);
    await this.assertCanAccessInvoice(invoice, user);
    return this.paymentRepo.find({ where: { invoiceId } });
  }

  async getLedgerEntries(accountId: string, user: any): Promise<LedgerEntry[]> {
    if (!this.isGlobalAdmin(user)) {
      if (accountId.startsWith("invoice:")) {
        const invoiceId = accountId.slice("invoice:".length);
        const invoice = await this.getInvoice(invoiceId);
        await this.assertCanAccessInvoice(invoice, user);
        return this.ledgerRepo.find({
          where: { accountId },
          order: { createdAt: "ASC" },
        });
      } else if (accountId.startsWith("payment:")) {
        const paymentId = accountId.slice("payment:".length);
        const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
        if (!payment) throw new NotFoundException("Payment not found");
        const invoice = await this.getInvoice(payment.invoiceId);
        await this.assertCanAccessInvoice(invoice, user);
        return this.ledgerRepo.find({
          where: { accountId },
          order: { createdAt: "ASC" },
        });
      }

      throw new ForbiddenException("Access denied: ledger account is outside your scope");
    }

    return this.ledgerRepo.find({
      where: { accountId },
      order: { createdAt: "ASC" },
    });
  }
}