import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Asset, AssetEvent, DigitalPassport } from "./asset.entity";
import { AssetsService } from "./assets.service";
import { AssetsController } from "./assets.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Asset, AssetEvent, DigitalPassport])],
  providers: [AssetsService],
  controllers: [AssetsController],
  exports: [AssetsService],
})
export class AssetsModule {}
