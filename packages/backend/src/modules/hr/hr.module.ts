import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WorkerType, Worker, AttendanceRecord, SalaryPayment } from "./hr.entity";
import { HrService } from "./hr.service";
import { HrController } from "./hr.controller";

@Module({
  imports: [TypeOrmModule.forFeature([WorkerType, Worker, AttendanceRecord, SalaryPayment])],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}