import { PaymentStatus } from '@prisma/client';
export declare class VerifyPaymentDto {
    status: PaymentStatus;
    notes?: string;
}
