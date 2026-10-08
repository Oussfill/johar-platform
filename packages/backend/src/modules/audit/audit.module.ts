import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuditLog, Notification } from "./audit.entity";
import { AuditService } from "./audit.service";
import { AuditController } from "./audit.controller";
import { AuditInterceptor } from "../../common/interceptors/audit.interceptor";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Notification])],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
