import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustodyVault, CustodyTransferRequest } from "./custody.entity";
import { Asset } from "../assets/asset.entity";
import { CustodyService } from "./custody.service";
import { CustodyController } from "./custody.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([CustodyVault, CustodyTransferRequest, Asset]),
  ],
  controllers: [CustodyController],
  providers: [CustodyService],
})
export class CustodyModule {}