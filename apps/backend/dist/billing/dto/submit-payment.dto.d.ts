import { PaymentMethod } from '@prisma/client';
export declare class SubmitPaymentDto {
    method: PaymentMethod;
    proofImageUrl?: string;
    notes?: string;
}
