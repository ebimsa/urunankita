import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CashFlowType } from '@prisma/client';

export class QueryLedgerDto {
  @IsOptional()
  @IsEnum(CashFlowType, { message: 'Tipe arus kas harus INCOME atau EXPENSE' })
  type?: CashFlowType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  period?: string; // Format YYYY-MM, contoh: "2026-10"

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number = 20;
}
