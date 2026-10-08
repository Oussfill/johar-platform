import { IsString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SubmitKycDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiProperty({ example: "L1" })
  @IsString()
  level: string;
}

export class ReviewKycDto {
  @ApiProperty({ example: "APPROVED" })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SubmitKycDocumentDto {
  @ApiProperty({ example: "NATIONAL_ID" })
  @IsString()
  documentType: string;

  @ApiProperty({ example: "https://storage.example.com/doc.pdf" })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileHash?: string;
}

export class RunComplianceCheckDto {
  @ApiProperty({ example: "USER" })
  @IsString()
  entityType: string;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty({ example: "AML" })
  @IsString()
  checkType: string;
}

export class ResolveCheckDto {
  @ApiProperty({ example: "CLEAR" })
  @IsString()
  status: string;

  @ApiProperty({ example: "LOW" })
  @IsString()
  riskLevel: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  result?: string;
}
