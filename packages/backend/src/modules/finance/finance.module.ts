import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Invoice, Payment, LedgerEntry } from "./finance.entity";
import { Transaction } from "../marketplace/marketplace.entity";
import { OrganizationMember } from "../organizations/organization-member.entity";
import { Asset } from "../assets/asset.entity";
import { FinanceService } from "./finance.service";
import { FinanceController } from "./finance.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payment, LedgerEntry, Transaction, OrganizationMember, Asset])],
  providers: [FinanceService],
  controllers: [FinanceController],
  exports: [FinanceService],
})
export class FinanceModule {}
