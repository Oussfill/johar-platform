import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BlockchainEvent } from "./blockchain.entity";
import { BlockchainService } from "./blockchain.service";
import { BlockchainController } from "./blockchain.controller";
import { Asset } from "../assets/asset.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BlockchainEvent, Asset])],
  providers: [BlockchainService],
  controllers: [BlockchainController],
  exports: [BlockchainService],
})
export class BlockchainModule {}
