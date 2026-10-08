import { IsString, IsOptional, IsNumber, IsPositive } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateWorkerTypeDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  baseRate?: number;

  @ApiPropertyOptional({ example: "hour" })
  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateWorkerDto {
  @ApiProperty()
  @IsString()
  workerTypeId: string;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class RecordAttendanceDto {
  @ApiProperty()
  @IsString()
  workerId: string;

  @ApiProperty({ example: "2026-09-17" })
  @IsString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hours?: number;

  @ApiPropertyOptional({ example: "PRESENT" })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RunPayrollDto {
  @ApiProperty({ example: "2026-09" })
  @IsString()
  periodLabel: string;
}