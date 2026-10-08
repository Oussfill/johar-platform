import { IsString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const TRUST_FACTORS = ["PHYSICAL_DATA", "LAB_RESULT", "CERTIFICATION"] as const;

export class ApplyTrustDto {
  @ApiProperty({ enum: TRUST_FACTORS })
  @IsString()
  factor: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evidence?: string;
}