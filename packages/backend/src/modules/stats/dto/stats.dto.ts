import { IsString, IsOptional, IsArray, IsNumber } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AnalyzeStatsDto {
  @ApiProperty({
    enum: ["descriptive", "ttest", "anova", "correlation", "regression", "cronbach"],
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  values?: number[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  y?: number[];

  @ApiPropertyOptional({ type: [[Number]] })
  @IsOptional()
  @IsArray()
  groups?: number[][];

  @ApiPropertyOptional({ type: [[Number]] })
  @IsOptional()
  @IsArray()
  items?: number[][];
}