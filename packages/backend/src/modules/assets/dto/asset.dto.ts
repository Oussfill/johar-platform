import { IsString, IsOptional, IsNumber, IsPositive, Min, Max } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateAssetDto {
  @ApiProperty({ example: "GOLD" })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: "BAR" })
  @IsOptional()
  @IsString()
  subType?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  weight: number;

  @ApiPropertyOptional({ example: "g" })
  @IsOptional()
  @IsString()
  weightUnit?: string;

  @ApiPropertyOptional({ example: "999.9" })
  @IsOptional()
  @IsString()
  purity?: string;

  @ApiPropertyOptional({ example: "24K" })
  @IsOptional()
  @IsString()
  karat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: "Jordan" })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ example: "JO" })
  @IsOptional()
  @IsString()
  originCountry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class TransitionAssetDto {
  @ApiProperty({ example: "REGISTERED" })
  @IsString()
  status: string;
}

export class AssetQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;
}
