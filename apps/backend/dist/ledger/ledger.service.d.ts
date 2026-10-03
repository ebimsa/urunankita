import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { QueryLedgerDto } from './dto/query-ledger.dto.js';
export declare class LedgerService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getLedger(groupId: string, query: QueryLedgerDto): Promise<{
        summary: {
            period?: {
                periodIncome: number;
                periodExpense: number;
                periodNet: number;
            } | undefined;
            totalIncome: number;
            totalExpense: number;
            currentBalance: number;
        };
        pagination: {
            totalEntries: number;
            currentPage: number;
            totalPages: number;
            limit: number;
        };
        entries: ({
            payment: {
                bill: {
                    id: string;
                    unit: {
                        id: string;
                        name: string;
                    } | null;
                    title: string;
                };
                id: string;
                method: import("@prisma/client").$Enums.PaymentMethod;
                proofImageUrl: string | null;
                payer: {
                    fullName: string;
                    id: string;
                };
            } | null;
        } & {
            id: string;
            createdAt: Date;
            groupId: string;
            description: string;
            type: import("@prisma/client").$Enums.CashFlowType;
            amount: number;
            paymentId: string | null;
            category: string;
            receiptUrl: string | null;
            entryDate: Date;
        })[];
    }>;
    recordExpense(groupId: string, userId: string, dto: CreateLedgerEntryDto): Promise<{
        message: string;
        entry: {
            id: string;
            createdAt: Date;
            groupId: string;
            description: string;
            type: import("@prisma/client").$Enums.CashFlowType;
            amount: number;
            paymentId: string | null;
            category: string;
            receiptUrl: string | null;
            entryDate: Date;
        };
    }>;
    recordIncome(groupId: string, userId: string, dto: CreateLedgerEntryDto): Promise<{
        message: string;
        entry: {
            id: string;
            createdAt: Date;
            groupId: string;
            description: string;
            type: import("@prisma/client").$Enums.CashFlowType;
            amount: number;
            paymentId: string | null;
            category: string;
            receiptUrl: string | null;
            entryDate: Date;
        };
    }>;
    deleteLedgerEntry(groupId: string, entryId: string, userId: string): Promise<{
        message: string;
    }>;
    getAuditLogs(groupId: string, limit?: number): Promise<({
        user: {
            fullName: string;
            email: string | null;
            phone: string | null;
            id: string;
        };
    } & {
        id: string;
        groupId: string;
        userId: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue;
        timestamp: Date;
    })[]>;
}
