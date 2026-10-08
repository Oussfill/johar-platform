import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Warehouse, Shipment, CustodyEvent } from "./logistics.entity";
import { LogisticsService } from "./logistics.service";
import { LogisticsController } from "./logistics.controller";
import { Asset } from "../assets/asset.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse, Shipment, CustodyEvent, Asset])],
  providers: [LogisticsService],
  controllers: [LogisticsController],
  exports: [LogisticsService],
})
export class LogisticsModule {}
