import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Laboratory, AssayRequest, AssayResult } from "./lab.entity";
import { Asset } from "../assets/asset.entity";
import { LabsService } from "./labs.service";
import { LabsController } from "./labs.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Laboratory, AssayRequest, AssayResult, Asset])],
  providers: [LabsService],
  controllers: [LabsController],
  exports: [LabsService],
})
export class LabsModule {}
