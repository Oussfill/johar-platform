import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Asset } from "../assets/asset.entity";
import { Listing, Transaction } from "../marketplace/marketplace.entity";
import { User } from "../users/user.entity";
import { AuditLog } from "../audit/audit.entity";
import { BlockchainEvent } from "../blockchain/blockchain.entity";
import { ControlCenterService } from "./control-center.service";
import { ControlCenterController } from "./control-center.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, Listing, Transaction, User, AuditLog, BlockchainEvent]),
  ],
  controllers: [ControlCenterController],
  providers: [ControlCenterService],
})
export class ControlCenterModule {}