import { Module } from "@nestjs/common";
import { VerificationController } from "./verification.controller";
import { AssetsModule } from "../assets/assets.module";

@Module({
  imports: [AssetsModule],
  controllers: [VerificationController],
})
export class VerificationModule {}
