var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
import { CashFlowType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
let LedgerService = class LedgerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLedger(groupId, query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        let dateFilter = undefined;
        if (query.period) {
            const [yearStr, monthStr] = query.period.split('-');
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10) - 1;
            const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
            const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
            dateFilter = { gte: startDate, lte: endDate };
        }
        else if (query.startDate || query.endDate) {
            dateFilter = {};
            if (query.startDate) {
                dateFilter.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                dateFilter.lte = new Date(query.endDate);
            }
        }
        const whereClause = {
            groupId,
            ...(query.type ? { type: query.type } : {}),
            ...(query.category
                ? {
                    category: {
                        contains: query.category,
                        mode: 'insensitive',
                    },
                }
                : {}),
            ...(dateFilter ? { entryDate: dateFilter } : {}),
        };
        const [allIncome, allExpense] = await Promise.all([
            this.prisma.cashLedger.aggregate({
                where: { groupId, type: CashFlowType.INCOME },
                _sum: { amount: true },
            }),
            this.prisma.cashLedger.aggregate({
                where: { groupId, type: CashFlowType.EXPENSE },
                _sum: { amount: true },
            }),
        ]);
        const totalIncome = allIncome._sum.amount || 0;
        const totalExpense = allExpense._sum.amount || 0;
        const currentBalance = totalIncome - totalExpense;
        let periodSummary = null;
        if (dateFilter) {
            const [periodInc, periodExp] = await Promise.all([
                this.prisma.cashLedger.aggregate({
                    where: { groupId, type: CashFlowType.INCOME, entryDate: dateFilter },
                    _sum: { amount: true },
                }),
                this.prisma.cashLedger.aggregate({
                    where: { groupId, type: CashFlowType.EXPENSE, entryDate: dateFilter },
                    _sum: { amount: true },
                }),
            ]);
            const periodIncome = periodInc._sum.amount || 0;
            const periodExpense = periodExp._sum.amount || 0;
            periodSummary = {
                periodIncome,
                periodExpense,
                periodNet: periodIncome - periodExpense,
            };
        }
        const [totalEntries, entries] = await Promise.all([
            this.prisma.cashLedger.count({ where: whereClause }),
            this.prisma.cashLedger.findMany({
                where: whereClause,
                orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: limit,
                include: {
                    payment: {
                        select: {
                            id: true,
                            method: true,
                            proofImageUrl: true,
                            payer: {
                                select: {
                                    id: true,
                                    fullName: true,
                                },
                            },
                            bill: {
                                select: {
                                    id: true,
                                    title: true,
                                    unit: {
                                        select: {
                                            id: true,
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        return {
            summary: {
                totalIncome,
                totalExpense,
                currentBalance,
                ...(periodSummary ? { period: periodSummary } : {}),
            },
            pagination: {
                totalEntries,
                currentPage: page,
                totalPages: Math.ceil(totalEntries / limit),
                limit,
            },
            entries,
        };
    }
    async recordExpense(groupId, userId, dto) {
        const entryDate = dto.entryDate ? new Date(dto.entryDate) : new Date();
        return this.prisma.$transaction(async (tx) => {
            const entry = await tx.cashLedger.create({
                data: {
                    groupId,
                    type: CashFlowType.EXPENSE,
                    amount: dto.amount,
                    category: dto.category,
                    description: dto.description,
                    receiptUrl: dto.receiptUrl,
                    entryDate,
                },
            });
            await tx.auditLog.create({
                data: {
                    groupId,
                    userId,
                    action: 'RECORD_EXPENSE',
                    details: {
                        entryId: entry.id,
                        amount: dto.amount,
                        category: dto.category,
                        description: dto.description,
                        receiptUrl: dto.receiptUrl,
                    },
                },
            });
            return {
                message: 'Pengeluaran kas berhasil dicatat',
                entry,
            };
        });
    }
    async recordIncome(groupId, userId, dto) {
        const entryDate = dto.entryDate ? new Date(dto.entryDate) : new Date();
        return this.prisma.$transaction(async (tx) => {
            const entry = await tx.cashLedger.create({
                data: {
                    groupId,
                    type: CashFlowType.INCOME,
                    amount: dto.amount,
                    category: dto.category,
                    description: dto.description,
                    receiptUrl: dto.receiptUrl,
                    entryDate,
                },
            });
            await tx.auditLog.create({
                data: {
                    groupId,
                    userId,
                    action: 'RECORD_MANUAL_INCOME',
                    details: {
                        entryId: entry.id,
                        amount: dto.amount,
                        category: dto.category,
                        description: dto.description,
                    },
                },
            });
            return {
                message: 'Pemasukan kas berhasil dicatat',
                entry,
            };
        });
    }
    async deleteLedgerEntry(groupId, entryId, userId) {
        const entry = await this.prisma.cashLedger.findFirst({
            where: { id: entryId, groupId },
        });
        if (!entry) {
            throw new NotFoundException('Catatan buku kas tidak ditemukan');
        }
        if (entry.paymentId) {
            throw new BadRequestException('Transaksi ini terhubung dengan pembayaran tagihan resmi. Pembatalan harus dilakukan melalui proses verifikasi/tolak pembayaran tagihan.');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.cashLedger.delete({
                where: { id: entryId },
            });
            await tx.auditLog.create({
                data: {
                    groupId,
                    userId,
                    action: 'DELETE_LEDGER_ENTRY',
                    details: {
                        deletedEntryId: entry.id,
                        type: entry.type,
                        amount: entry.amount,
                        category: entry.category,
                        description: entry.description,
                    },
                },
            });
            return {
                message: 'Catatan buku kas berhasil dihapus',
            };
        });
    }
    async getAuditLogs(groupId, limit = 50) {
        const logs = await this.prisma.auditLog.findMany({
            where: { groupId },
            orderBy: { timestamp: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        return logs;
    }
};
LedgerService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], LedgerService);
export { LedgerService };
//# sourceMappingURL=ledger.service.js.map