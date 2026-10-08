import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Organization } from "./organization.entity";
import { OrganizationMember } from "./organization-member.entity";

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(OrganizationMember) private memberRepo: Repository<OrganizationMember>
  ) {}

  async create(data: Partial<Organization>): Promise<Organization> {
    const org = this.orgRepo.create(data);
    return this.orgRepo.save(org);
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException("Organization not found");
    return org;
  }

  async findAll(page = 1, limit = 20): Promise<{ data: Organization[]; total: number }> {
    const [data, total] = await this.orgRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });
    return { data, total };
  }

  async addMember(orgId: string, userId: string, role: string) {
    const member = this.memberRepo.create({
      organizationId: orgId,
      userId,
      role,
    });
    return this.memberRepo.save(member);
  }

  async getMembers(orgId: string) {
    return this.memberRepo.find({ where: { organizationId: orgId } });
  }

  async findByUser(userId: string): Promise<{ data: Organization[]; total: number }> {
    const memberships = await this.memberRepo.find({
      where: { userId, isActive: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);
    if (orgIds.length === 0) return { data: [], total: 0 };

    const data = await this.orgRepo.findByIds(orgIds);
    return { data, total: data.length };
  }
}
