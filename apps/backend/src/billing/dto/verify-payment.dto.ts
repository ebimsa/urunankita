import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class VerifyPaymentDto {
  @IsEnum(PaymentStatus, { message: 'Status verifikasi harus SUCCESS atau REJECTED' })
  status: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
