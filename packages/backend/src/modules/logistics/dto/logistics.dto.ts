import { IsString, IsOptional, IsNumber, IsPositive } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateWarehouseDto {
  @ApiProperty({ example: "Dubai Gold Vault" })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty({ example: "AE" })
  @IsString()
  country: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: "STANDARD" })
  @IsOptional()
  @IsString()
  securityLevel?: string;
}

export class CreateShipmentDto {
  @ApiProperty()
  @IsString()
  originWarehouseId: string;

  @ApiProperty()
  @IsString()
  destinationWarehouseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  insuranceValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShipmentStatusDto {
  @ApiProperty({ example: "IN_TRANSIT" })
  @IsString()
  status: string;
}

export class RecordCustodyEventDto {
  @ApiProperty()
  @IsString()
  assetId: string;

  @ApiProperty({ example: "TRANSFER" })
  @IsString()
  eventType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromCustodianId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toCustodianId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toLocationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
