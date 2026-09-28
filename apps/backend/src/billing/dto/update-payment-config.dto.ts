import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentConfigDto {
  @IsOptional()
  @IsBoolean()
  qrisEnabled?: boolean;

  @IsOptional()
  @IsString()
  qrisImageUrl?: string;

  @IsOptional()
  @IsString()
  rawQrString?: string;

  @IsOptional()
  @IsString()
  merchantName?: string;

  @IsOptional()
  @IsBoolean()
  bankEnabled?: boolean;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsString()
  accountDetails?: string;

  @IsOptional()
  @IsBoolean()
  cashEnabled?: boolean;

  @IsOptional()
  @IsString()
  instructions?: string;
}
