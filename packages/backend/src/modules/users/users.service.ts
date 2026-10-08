import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";

const ALLOWED_UPDATE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "language",
] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findAll(page = 1, limit = 20): Promise<{ data: User[]; total: number }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const [data, total] = await this.userRepo.findAndCount({
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      order: { createdAt: "DESC" },
    });
    return { data, total };
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);

    const sanitized: Record<string, any> = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in data && (data as any)[field] !== undefined) {
        sanitized[field] = (data as any)[field];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      throw new BadRequestException("No valid fields to update");
    }

    Object.assign(user, sanitized);
    return this.userRepo.save(user);
  }

  async updatePassword(id: string, newPasswordHash: string): Promise<void> {
    const user = await this.findById(id);
    user.passwordHash = newPasswordHash;
    await this.userRepo.save(user);
  }

  async setMfaSecret(id: string, mfaSecret: string): Promise<void> {
    const user = await this.findById(id);
    user.mfaSecret = mfaSecret;
    user.isMfaEnabled = true;
    await this.userRepo.save(user);
  }

  async disableMfa(id: string): Promise<void> {
    const user = await this.findById(id);
    user.mfaSecret = null as any;
    user.isMfaEnabled = false;
    await this.userRepo.save(user);
  }
}
