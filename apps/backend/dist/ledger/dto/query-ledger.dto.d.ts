import { CashFlowType } from '@prisma/client';
export declare class QueryLedgerDto {
    type?: CashFlowType;
    category?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
