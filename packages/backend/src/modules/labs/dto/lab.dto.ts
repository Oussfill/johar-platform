import { IsString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateLabDto {
  @ApiProperty({ example: "Dubai Central Lab" })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiProperty({ example: "DCL-001" })
  @IsString()
  registrationNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;
}

export class SubmitAssayRequestDto {
  @ApiProperty()
  @IsString()
  assetId: string;

  @ApiProperty()
  @IsString()
  laboratoryId: string;

  @ApiProperty({ example: "XRF" })
  @IsString()
  assayType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sampleCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class IssueAssayResultDto {
  @ApiProperty({ example: { purity: "999.9", weight: "100g" } })
  result: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificateHash?: string;
}
