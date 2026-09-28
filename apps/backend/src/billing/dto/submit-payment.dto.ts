import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class SubmitPaymentDto {
  @IsEnum(PaymentMethod, { message: 'Metode pembayaran tidak valid' })
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  proofImageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
