import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { WorkerType, Worker, AttendanceRecord, SalaryPayment } from "./hr.entity";

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(WorkerType) private workerTypes: Repository<WorkerType>,
    @InjectRepository(Worker) private workers: Repository<Worker>,
    @InjectRepository(AttendanceRecord) private attendance: Repository<AttendanceRecord>,
    @InjectRepository(SalaryPayment) private payroll: Repository<SalaryPayment>
  ) {}

  private isGlobalAdmin(user: any): boolean {
    return user?.roles?.includes("SUPER_ADMIN") || user?.roles?.includes("PLATFORM_ADMIN");
  }

  private orgFor(user: any): string {
    if (user?.organizationId) return user.organizationId;
    throw new ForbiddenException("Organization context required");
  }

  private scope(user: any): Record<string, string> {
    if (this.isGlobalAdmin(user)) return {};
    return { organizationId: this.orgFor(user) };
  }

  private async assertScope(user: any, organizationId: string): Promise<void> {
    if (this.isGlobalAdmin(user)) return;
    if (user.organizationId && user.organizationId === organizationId) return;
    throw new ForbiddenException("Access denied: cross-organization access prohibited");
  }

  // ---- Worker types ----
  async createWorkerType(dto: any, user: any): Promise<WorkerType> {
    const wt = this.workerTypes.create({ ...dto, organizationId: this.orgFor(user) } as WorkerType);
    return this.workerTypes.save(wt);
  }

  async findAllWorkerTypes(user: any): Promise<WorkerType[]> {
    return this.workerTypes.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async updateWorkerType(id: string, dto: any, user: any): Promise<WorkerType> {
    const wt = await this.workerTypes.findOne({ where: { id } });
    if (!wt) throw new NotFoundException("Worker type not found");
    await this.assertScope(user, wt.organizationId);
    Object.assign(wt, dto);
    return this.workerTypes.save(wt);
  }

  // ---- Workers ----
  async createWorker(dto: any, user: any): Promise<Worker> {
    const wt = await this.workerTypes.findOne({ where: { id: dto.workerTypeId } });
    if (!wt) throw new NotFoundException("Worker type not found");
    await this.assertScope(user, wt.organizationId);
    const worker = this.workers.create({
      ...dto,
      organizationId: wt.organizationId,
      workerCode: `WK-${Date.now()}`,
    } as Worker);
    return this.workers.save(worker);
  }

  async findAllWorkers(user: any): Promise<Worker[]> {
    return this.workers.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async findWorker(id: string, user: any): Promise<Worker> {
    const worker = await this.workers.findOne({ where: { id } });
    if (!worker) throw new NotFoundException("Worker not found");
    await this.assertScope(user, worker.organizationId);
    return worker;
  }

  async updateWorker(id: string, dto: any, user: any): Promise<Worker> {
    const worker = await this.findWorker(id, user);
    Object.assign(worker, dto);
    return this.workers.save(worker);
  }

  // ---- Attendance ----
  async recordAttendance(dto: any, user: any): Promise<AttendanceRecord> {
    const worker = await this.findWorker(dto.workerId, user);
    const rec = this.attendance.create({
      workerId: worker.id,
      organizationId: worker.organizationId,
      date: dto.date,
      hours: dto.hours ?? (dto.type === "PRESENT" ? 8 : 0),
      type: dto.type || "PRESENT",
      notes: dto.notes,
    });
    return this.attendance.save(rec);
  }

  async findAllAttendance(user: any): Promise<AttendanceRecord[]> {
    return this.attendance.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  // ---- Payroll ----
  async runPayroll(periodLabel: string, user: any): Promise<SalaryPayment[]> {
    const scope = this.scope(user);
    const workers = await this.workers.find({ where: scope, relations: ["workerType"] });
    const created: SalaryPayment[] = [];
    for (const worker of workers) {
      const rate = worker.workerType?.baseRate ?? 0;
      const hours = (await this.attendance.find({ where: { workerId: worker.id } }))
        .filter((a) => a.type === "PRESENT" || a.type === "HALF_DAY")
        .reduce((sum, a) => sum + (a.hours || 0), 0);
      const baseAmount = Number((rate * hours).toFixed(2));
      const payment = await this.payroll.save(
        this.payroll.create({
          workerId: worker.id,
          organizationId: worker.organizationId,
          periodLabel,
          baseAmount,
          bonuses: 0,
          deductions: 0,
          netAmount: baseAmount,
        })
      );
      created.push(payment);
    }
    return created;
  }

  async findAllPayments(user: any): Promise<SalaryPayment[]> {
    return this.payroll.find({ where: this.scope(user), order: { createdAt: "DESC" } });
  }

  async payrollOverview(user: any): Promise<{ period: string; totalNet: number; pending: number; paid: number }> {
    const payments = await this.payroll.find({ where: this.scope(user) });
    const totalNet = payments.reduce((sum, p) => sum + Number(p.netAmount), 0);
    return {
      period: "LATEST",
      totalNet,
      pending: payments.filter((p) => p.status === "PENDING").length,
      paid: payments.filter((p) => p.status === "PAID").length,
    };
  }

  async payPayment(id: string, user: any): Promise<SalaryPayment> {
    const payment = await this.payroll.findOne({ where: { id } });
    if (!payment) throw new NotFoundException("Payment not found");
    await this.assertScope(user, payment.organizationId);
    if (payment.status === "PAID") throw new BadRequestException("Payment already paid");
    payment.status = "PAID";
    payment.paidAt = new Date();
    return this.payroll.save(payment);
  }
}