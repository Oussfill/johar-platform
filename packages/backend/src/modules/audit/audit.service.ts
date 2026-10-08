import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog, Notification } from "./audit.entity";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>
  ) {}

  async log(data: {
    actorId?: string;
    organizationId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    before?: any;
    after?: any;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    reason?: string;
  }): Promise<AuditLog> {
    const entry = this.auditRepo.create(data);
    return this.auditRepo.save(entry);
  }

  async getAuditLogs(
    page = 1,
    limit = 50,
    filters?: { actorId?: string; resource?: string; action?: string },
    organizationId?: string
  ): Promise<{ data: AuditLog[]; total: number }> {
    const qb = this.auditRepo.createQueryBuilder("audit");

    if (filters?.actorId) qb.andWhere("audit.actorId = :actorId", { actorId: filters.actorId });
    if (filters?.resource) qb.andWhere("audit.resource = :resource", { resource: filters.resource });
    if (filters?.action) qb.andWhere("audit.action = :action", { action: filters.action });
    if (organizationId) {
      qb.andWhere("audit.organizationId = :organizationId", { organizationId });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("audit.createdAt", "DESC")
      .getMany();

    return { data, total };
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message?: string;
    actionUrl?: string;
    metadata?: any;
  }): Promise<Notification> {
    const notif = this.notifRepo.create(data);
    return this.notifRepo.save(notif);
  }

  async getNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;
    return this.notifRepo.find({ where, order: { createdAt: "DESC" }, take: 50 });
  }

  async markNotificationRead(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) where.userId = userId;
    await this.notifRepo.update(where, { isRead: true });
  }
}
