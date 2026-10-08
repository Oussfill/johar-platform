import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TrustVerification } from "./trust.entity";
import { TrustService } from "./trust.service";
import { TrustController } from "./trust.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TrustVerification])],
  controllers: [TrustController],
  providers: [TrustService],
})
export class TrustModule {}