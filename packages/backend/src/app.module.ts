import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { LabsModule } from "./modules/labs/labs.module";
import { MarketplaceModule } from "./modules/marketplace/marketplace.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { ComplianceModule } from "./modules/compliance/compliance.module";
import { LogisticsModule } from "./modules/logistics/logistics.module";
import { BlockchainModule } from "./modules/blockchain/blockchain.module";
import { AuditModule } from "./modules/audit/audit.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { VerificationModule } from "./modules/verification/verification.module";
import { RbacModule } from "./modules/rbac/rbac.module";
import { ErpModule } from "./modules/erp/erp.module";
import { HrModule } from "./modules/hr/hr.module";
import { CustodyModule } from "./modules/custody/custody.module";
import { ContentModule } from "./modules/content/content.module";
import { TrustModule } from "./modules/trust/trust.module";
import { StatsModule } from "./modules/stats/stats.module";
import { ControlCenterModule } from "./modules/control-center/control-center.module";
import { ProvidersModule } from "./common/providers/providers.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { HealthModule } from "./health/health.module";
import { MetricsModule } from "./common/metrics/metrics.module";
import { TenantMiddleware } from "./common/middleware/tenant.middleware";
import { AbacGuard } from "./common/guards/abac.guard";
import { RbacGuard } from "./common/guards/rbac.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "15m" },
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 3,
      },
      {
        name: "medium",
        ttl: 10000,
        limit: 20,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== "production",
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    OrganizationsModule,
    AssetsModule,
    LabsModule,
    MarketplaceModule,
    FinanceModule,
    ComplianceModule,
    LogisticsModule,
    BlockchainModule,
    AuditModule,
    NotificationsModule,
    VerificationModule,
    RbacModule,
    ErpModule,
    HrModule,
    CustodyModule,
    ContentModule,
    TrustModule,
    StatsModule,
    ControlCenterModule,
    ProvidersModule,
    SupabaseModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AbacGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
