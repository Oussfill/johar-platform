import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ErpSupplier,
  CrmCustomer,
  CrmInteraction,
  CrmOpportunity,
  PurchaseRequest,
  Rfq,
  RfqOffer,
  PurchaseOrder,
  GoodsReceipt,
  SalesOrder,
  SalesInvoice,
} from "./erp.entity";
import { User } from "../users/user.entity";

const PURCHASE_REQUEST_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["ORDERED", "CANCELLED"],
  REJECTED: [],
  CANCELLED: [],
  ORDERED: [],
};

const RFQ_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT", "CLOSED"],
  SENT: ["CLOSED"],
  CLOSED: [],
};

const PURCHASE_ORDER_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

const GOODS_RECEIPT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["INSPECTED"],
  INSPECTED: [],
};

const SALES_ORDER_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["VERIFIED", "CANCELLED"],
  VERIFIED: ["FULFILLED", "CANCELLED"],
  FULFILLED: ["PAID"],
  PAID: [],
  CANCELLED: [],
};

const SALES_INVOICE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ISSUED", "VOID"],
  ISSUED: ["PAID", "VOID"],
  PAID: [],
  VOID: [],
};

@Injectable()
export class ErpService {
  constructor(
    @InjectRepository(ErpSupplier) private suppliers: Repository<ErpSupplier>,
    @InjectRepository(CrmCustomer) private customers: Repository<CrmCustomer>,
    @InjectRepository(CrmInteraction) private interactions: Repository<CrmInteraction>,
    @InjectRepository(CrmOpportunity) private opportunities: Repository<CrmOpportunity>,
    @InjectRepository(PurchaseRequest) private purchaseRequests: Repository<PurchaseRequest>,
    @InjectRepository(Rfq) private rfqs: Repository<Rfq>,
    @InjectRepository(RfqOffer) private rfqOffers: Repository<RfqOffer>,
    @InjectRepository(PurchaseOrder) private purchaseOrders: Repository<PurchaseOrder>,
    @InjectRepository(GoodsReceipt) private goodsReceipts: Repository<GoodsReceipt>,
    @InjectRepository(SalesOrder) private salesOrders: Repository<SalesOrder>,
    @InjectRepository(SalesInvoice) private salesInvoices: Repository<SalesInvoice>
  ) {}

  private isGlobalAdmin(user: any): boolean {
    return user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
  }

  private hasAnyRole(user: any, roles: string[]): boolean {
    return roles.some((r) => user?.roles?.includes(r));
  }

  private orgFor(user: any, explicit?: string): string {
    if (explicit && this.isGlobalAdmin(user)) return explicit;
    if (user?.organizationId) return user.organizationId;
    throw new ForbiddenException("Organization context required");
  }

  private scope(user: any): Record<string, string> {
    if (this.isGlobalAdmin(user)) return {};
    if (!user?.organizationId) throw new ForbiddenException("Organization context required");
    return { organizationId: user.organizationId };
  }

  private async assertScope(user: any, organizationId: string): Promise<void> {
    if (this.isGlobalAdmin(user)) return;
    if (user.organizationId && user.organizationId === organizationId) return;
    throw new ForbiddenException("Access denied: cross-organization access prohibited");
  }

  private async transition<T extends { id: string; status: string }>(
    repo: Repository<T>,
    id: string,
    status: string,
    transitions: Record<string, string[]>,
    user: any,
    orgColumn = "organizationId"
  ): Promise<T> {
    const rec = await repo.findOne({ where: { id } as any });
    if (!rec) throw new NotFoundException("Record not found");
    await this.assertScope(user, (rec as any)[orgColumn]);
    if (!(transitions[(rec as any).status]?.includes(status))) {
      throw new BadRequestException(
        `Invalid status transition: ${(rec as any).status} -> ${status}`
      );
    }
    (rec as any).status = status;
    return repo.save(rec);
  }

  // ---- Suppliers ----
  async createSupplier(dto: any, user: any): Promise<ErpSupplier> {
    const supplier = this.suppliers.create({ ...dto, organizationId: this.orgFor(user, dto.organizationId) } as ErpSupplier);
    return this.suppliers.save(supplier);
  }

  async findAllSuppliers(user: any): Promise<ErpSupplier[]> {
    return this.suppliers.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async findSupplier(id: string, user: any): Promise<ErpSupplier> {
    const supplier = await this.suppliers.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException("Supplier not found");
    await this.assertScope(user, supplier.organizationId);
    return supplier;
  }

  async updateSupplier(id: string, dto: any, user: any): Promise<ErpSupplier> {
    const supplier = await this.findSupplier(id, user);
    Object.assign(supplier, dto);
    return this.suppliers.save(supplier);
  }

  async evaluateSupplier(id: string, rating: number, user: any): Promise<ErpSupplier> {
    const supplier = await this.findSupplier(id, user);
    supplier.rating = rating;
    return this.suppliers.save(supplier);
  }

  // ---- CRM ----
  async createCustomer(dto: any, user: any): Promise<CrmCustomer> {
    const customer = this.customers.create({ ...dto, organizationId: this.orgFor(user, dto.organizationId) } as CrmCustomer);
    return this.customers.save(customer);
  }

  async findAllCustomers(user: any): Promise<CrmCustomer[]> {
    return this.customers.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async createInteraction(dto: any, user: any): Promise<CrmInteraction> {
    const customer = await this.customers.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException("Customer not found");
    await this.assertScope(user, customer.organizationId);
    const interaction = this.interactions.create({
      customerId: dto.customerId,
      organizationId: customer.organizationId,
      type: dto.type,
      summary: dto.summary,
      nextAction: dto.nextAction,
    });
    return this.interactions.save(interaction);
  }

  async findInteractionsByCustomer(customerId: string, user: any): Promise<CrmInteraction[]> {
    const customer = await this.customers.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException("Customer not found");
    await this.assertScope(user, customer.organizationId);
    return this.interactions.find({ where: { customerId }, order: { createdAt: "DESC" } });
  }

  async createOpportunity(dto: any, user: any): Promise<CrmOpportunity> {
    const customer = await this.customers.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException("Customer not found");
    await this.assertScope(user, customer.organizationId);
    const opportunity = this.opportunities.create({
      customerId: dto.customerId,
      organizationId: customer.organizationId,
      title: dto.title,
      value: dto.value,
      stage: dto.stage || "LEAD",
      probability: dto.probability ?? 10,
      closeDate: dto.closeDate ? new Date(dto.closeDate) : undefined,
    });
    return this.opportunities.save(opportunity);
  }

  async findAllOpportunities(user: any): Promise<CrmOpportunity[]> {
    return this.opportunities.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async updateOpportunity(id: string, dto: any, user: any): Promise<CrmOpportunity> {
    const opportunity = await this.opportunities.findOne({ where: { id } });
    if (!opportunity) throw new NotFoundException("Opportunity not found");
    await this.assertScope(user, opportunity.organizationId);
    if (dto.stage) opportunity.stage = dto.stage;
    if (dto.probability !== undefined) opportunity.probability = dto.probability;
    if (dto.closeDate) opportunity.closeDate = new Date(dto.closeDate);
    return this.opportunities.save(opportunity);
  }

  // ---- Procurement ----
  async createPurchaseRequest(dto: any, user: any): Promise<PurchaseRequest> {
    const pr = this.purchaseRequests.create({ ...dto, organizationId: this.orgFor(user, dto.organizationId), requestedBy: user.id } as PurchaseRequest);
    return this.purchaseRequests.save(pr);
  }

  async findAllPurchaseRequests(user: any): Promise<PurchaseRequest[]> {
    return this.purchaseRequests.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async updatePurchaseRequest(id: string, status: string, user: any): Promise<PurchaseRequest> {
    return this.transition(this.purchaseRequests, id, status, PURCHASE_REQUEST_TRANSITIONS, user);
  }

  async createRfq(dto: any, user: any): Promise<Rfq> {
    const rfq = this.rfqs.create({ ...dto, organizationId: this.orgFor(user, dto.organizationId) } as Rfq);
    return this.rfqs.save(rfq);
  }

  async findAllRfqs(user: any): Promise<Rfq[]> {
    return this.rfqs.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async updateRfq(id: string, status: string, user: any): Promise<Rfq> {
    return this.transition(this.rfqs, id, status, RFQ_TRANSITIONS, user);
  }

  async submitRfqOffer(rfqId: string, dto: any, user: any): Promise<RfqOffer> {
    const rfq = await this.rfqs.findOne({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException("Rfq not found");
    await this.assertScope(user, rfq.organizationId);
    const supplier = await this.suppliers.findOne({ where: { id: dto.supplierId } });
    if (!supplier) throw new NotFoundException("Supplier not found");
    await this.assertScope(user, supplier.organizationId);
    if (rfq.status !== "SENT") throw new BadRequestException("RFQ must be SENT to receive offers");
    const offer = this.rfqOffers.create({
      rfqId,
      supplierId: dto.supplierId,
      organizationId: rfq.organizationId,
      price: dto.price,
      currency: dto.currency || "USD",
      deliveryDays: dto.deliveryDays,
      notes: dto.notes,
    });
    return this.rfqOffers.save(offer);
  }

  async chooseRfqOffer(rfqId: string, offerId: string, user: any): Promise<RfqOffer> {
    const rfq = await this.rfqs.findOne({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException("Rfq not found");
    await this.assertScope(user, rfq.organizationId);
    const offer = await this.rfqOffers.findOne({ where: { id: offerId, rfqId } });
    if (!offer) throw new NotFoundException("Offer not found");
    await this.rfqOffers.update({ rfqId }, { chosen: false });
    offer.chosen = true;
    return this.rfqOffers.save(offer);
  }

  async createPurchaseOrder(dto: any, user: any): Promise<PurchaseOrder> {
    const po = this.purchaseOrders.create({ ...dto, organizationId: this.orgFor(user, dto.organizationId) } as PurchaseOrder);
    return this.purchaseOrders.save(po);
  }

  async findAllPurchaseOrders(user: any): Promise<PurchaseOrder[]> {
    return this.purchaseOrders.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async updatePurchaseOrder(id: string, status: string, user: any): Promise<PurchaseOrder> {
    return this.transition(this.purchaseOrders, id, status, PURCHASE_ORDER_TRANSITIONS, user);
  }

  async createGoodsReceipt(dto: any, user: any): Promise<GoodsReceipt> {
    const po = await this.purchaseOrders.findOne({ where: { id: dto.purchaseOrderId } });
    if (!po) throw new NotFoundException("Purchase order not found");
    await this.assertScope(user, po.organizationId);
    const receipt = this.goodsReceipts.create({
      purchaseOrderId: po.id,
      organizationId: po.organizationId,
      receivedBy: user.id,
      quantityReceived: dto.quantityReceived,
      condition: dto.condition || "OK",
      notes: dto.notes,
    });
    return this.goodsReceipts.save(receipt);
  }

  async findAllGoodsReceipts(user: any): Promise<GoodsReceipt[]> {
    return this.goodsReceipts.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async inspectGoodsReceipt(id: string, user: any): Promise<GoodsReceipt> {
    return this.transition(this.goodsReceipts, id, "INSPECTED", GOODS_RECEIPT_TRANSITIONS, user);
  }

  // ---- Sales ----
  async createSalesOrder(dto: any, user: any): Promise<SalesOrder> {
    const order = this.salesOrders.create({ ...dto, organizationId: this.orgFor(user, dto.organizationId) } as SalesOrder);
    return this.salesOrders.save(order);
  }

  async findAllSalesOrders(user: any): Promise<SalesOrder[]> {
    return this.salesOrders.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async updateSalesOrder(id: string, status: string, user: any): Promise<SalesOrder> {
    return this.transition(this.salesOrders, id, status, SALES_ORDER_TRANSITIONS, user);
  }

  async createSalesInvoice(dto: any, user: any): Promise<SalesInvoice> {
    const order = await this.salesOrders.findOne({ where: { id: dto.salesOrderId } });
    if (!order) throw new NotFoundException("Sales order not found");
    await this.assertScope(user, order.organizationId);
    const invoice = this.salesInvoices.create({
      salesOrderId: order.id,
      organizationId: order.organizationId,
      invoiceNumber: `INV-${Date.now()}`,
      amount: dto.amount,
      currency: dto.currency || "USD",
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: order.status === "FULFILLED" ? "ISSUED" : undefined,
    });
    return this.salesInvoices.save(invoice);
  }

  async findAllSalesInvoices(user: any): Promise<SalesInvoice[]> {
    return this.salesInvoices.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async paySalesInvoice(id: string, user: any): Promise<SalesInvoice> {
    const invoice = await this.salesInvoices.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException("Invoice not found");
    await this.assertScope(user, invoice.organizationId);
    if (!(SALES_INVOICE_TRANSITIONS[invoice.status]?.includes("PAID"))) {
      throw new BadRequestException(`Invalid status transition: ${invoice.status} -> PAID`);
    }
    invoice.status = "PAID";
    invoice.paidAt = new Date();
    return this.salesInvoices.save(invoice);
  }

  async updateSalesInvoice(id: string, status: string, user: any): Promise<SalesInvoice> {
    return this.transition(this.salesInvoices, id, status, SALES_INVOICE_TRANSITIONS, user);
  }
}