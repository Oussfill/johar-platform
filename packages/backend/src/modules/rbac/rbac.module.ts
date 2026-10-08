import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";
import { UserRole } from "./user-role.entity";
import { RbacService } from "./rbac.service";
import { RbacController } from "./rbac.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, UserRole])],
  providers: [RbacService],
  controllers: [RbacController],
  exports: [RbacService],
})
export class RbacModule {}
