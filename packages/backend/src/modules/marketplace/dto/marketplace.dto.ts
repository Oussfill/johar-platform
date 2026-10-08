import { IsString, IsOptional, IsNumber, IsPositive, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateListingDto {
  @ApiProperty()
  @IsString()
  assetId: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: "USD" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: "FIXED" })
  @IsOptional()
  @IsString()
  listingType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class MakeOfferDto {
  @ApiProperty({ example: 45000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}

export class NegotiateDto {
  @ApiProperty({ example: 46000 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateTransactionStatusDto {
  @ApiProperty({ example: "PAID" })
  @IsString()
  status: string;
}
