var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, ConflictException, Injectable, NotFoundException, } from '@nestjs/common';
import { BillStatus, CashFlowType, GroupType, MembershipStatus, PaymentStatus, } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { QrisService } from '../qris/qris.service.js';
let BillingService = class BillingService {
    prisma;
    qrisService;
    constructor(prisma, qrisService) {
        this.prisma = prisma;
        this.qrisService = qrisService;
    }
    async getPaymentConfig(groupId) {
        let config = await this.prisma.groupPaymentConfig.findUnique({
            where: { groupId },
        });
        if (!config) {
            config = await this.prisma.groupPaymentConfig.create({
                data: {
                    groupId,
                    cashEnabled: true,
                },
            });
        }
        return config;
    }
    async updatePaymentConfig(groupId, dto) {
        let merchantName = dto.merchantName;
        if (dto.rawQrString && dto.rawQrString.trim()) {
            const cleanQr = dto.rawQrString.trim();
            if (cleanQr.startsWith('000201')) {
                const isValid = this.qrisService.validateQris(cleanQr);
                if (!isValid) {
                    throw new BadRequestException('String QRIS tidak valid. Pastikan format EMVCo sesuai (dimulai 000201) dan checksum benar');
                }
                if (!merchantName) {
                    const parsed = this.qrisService.parseQris(cleanQr);
                    merchantName = parsed.merchantName;
                }
            }
        }
        const config = await this.prisma.groupPaymentConfig.upsert({
            where: { groupId },
            create: {
                groupId,
                qrisEnabled: dto.qrisEnabled ?? false,
                qrisImageUrl: dto.qrisImageUrl,
                rawQrString: dto.rawQrString?.trim(),
                merchantName,
                bankEnabled: dto.bankEnabled ?? false,
                bankName: dto.bankName,
                accountNumber: dto.accountNumber,
                accountHolder: dto.accountHolder,
                accountDetails: dto.accountDetails,
                cashEnabled: dto.cashEnabled ?? true,
                instructions: dto.instructions,
            },
            update: {
                ...(dto.qrisEnabled !== undefined && { qrisEnabled: dto.qrisEnabled }),
                ...(dto.qrisImageUrl !== undefined && { qrisImageUrl: dto.qrisImageUrl }),
                ...(dto.rawQrString !== undefined && { rawQrString: dto.rawQrString ? dto.rawQrString.trim() : null }),
                ...(merchantName !== undefined && { merchantName }),
                ...(dto.bankEnabled !== undefined && { bankEnabled: dto.bankEnabled }),
                ...(dto.bankName !== undefined && { bankName: dto.bankName }),
                ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
                ...(dto.accountHolder !== undefined && { accountHolder: dto.accountHolder }),
                ...(dto.accountDetails !== undefined && { accountDetails: dto.accountDetails }),
                ...(dto.cashEnabled !== undefined && { cashEnabled: dto.cashEnabled }),
                ...(dto.instructions !== undefined && { instructions: dto.instructions }),
            },
        });
        return {
            message: 'Konfigurasi pembayaran berhasil diperbarui',
            config,
        };
    }
    async createBill(groupId, dto) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new NotFoundException('Grup komunitas tidak ditemukan');
        }
        const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);
        const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        if (dto.applyToAll) {
            if (group.type === GroupType.PHYSICAL_UNIT) {
                const units = await this.prisma.groupUnit.findMany({
                    where: { groupId },
                });
                if (units.length === 0) {
                    throw new BadRequestException('Belum ada unit hunian yang terdaftar di grup ini');
                }
                const createdBills = await this.prisma.$transaction(units.map((unit) => this.prisma.bill.create({
                    data: {
                        groupId,
                        unitId: unit.id,
                        title: dto.title,
                        period: dto.period,
                        dueDate,
                        status: BillStatus.UNPAID,
                        totalAmount,
                        items: {
                            create: dto.items.map((i) => ({
                                name: i.name,
                                amount: i.amount,
                            })),
                        },
                    },
                })));
                return {
                    message: `${createdBills.length} lembar tagihan berhasil diterbitkan untuk seluruh unit hunian`,
                    totalBills: createdBills.length,
                    totalAmountPerBill: totalAmount,
                };
            }
            else {
                const members = await this.prisma.groupMember.findMany({
                    where: {
                        groupId,
                        status: MembershipStatus.APPROVED,
                        isActive: true,
                    },
                });
                if (members.length === 0) {
                    throw new BadRequestException('Belum ada anggota aktif di grup ini');
                }
                const createdBills = await this.prisma.$transaction(members.map((member) => this.prisma.bill.create({
                    data: {
                        groupId,
                        memberId: member.id,
                        title: dto.title,
                        period: dto.period,
                        dueDate,
                        status: BillStatus.UNPAID,
                        totalAmount,
                        items: {
                            create: dto.items.map((i) => ({
                                name: i.name,
                                amount: i.amount,
                            })),
                        },
                    },
                })));
                return {
                    message: `${createdBills.length} lembar tagihan berhasil diterbitkan untuk seluruh anggota`,
                    totalBills: createdBills.length,
                    totalAmountPerBill: totalAmount,
                };
            }
        }
        if (group.type === GroupType.PHYSICAL_UNIT && !dto.unitId) {
            throw new BadRequestException('ID unit hunian wajib disertakan untuk grup tipe Unit Fisik');
        }
        if (group.type === GroupType.DIRECT_MEMBER && !dto.memberId) {
            throw new BadRequestException('ID anggota wajib disertakan untuk grup tipe Anggota Langsung');
        }
        const bill = await this.prisma.bill.create({
            data: {
                groupId,
                unitId: dto.unitId,
                memberId: dto.memberId,
                title: dto.title,
                period: dto.period,
                dueDate,
                status: BillStatus.UNPAID,
                totalAmount,
                items: {
                    create: dto.items.map((i) => ({
                        name: i.name,
                        amount: i.amount,
                    })),
                },
            },
            include: {
                items: true,
                unit: true,
                member: {
                    include: {
                        user: {
                            select: { fullName: true, phone: true, email: true },
                        },
                    },
                },
            },
        });
        return {
            message: 'Lembar tagihan berhasil diterbitkan',
            bill,
        };
    }
    async getGroupBills(groupId, status) {
        return this.prisma.bill.findMany({
            where: {
                groupId,
                ...(status && { status }),
            },
            include: {
                items: true,
                unit: { select: { id: true, name: true } },
                member: {
                    select: {
                        id: true,
                        user: { select: { fullName: true, phone: true } },
                    },
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getMyBills(groupId, userId) {
        const membership = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!membership || !membership.isActive) {
            throw new NotFoundException('Anda bukan anggota aktif dalam grup ini');
        }
        return this.prisma.bill.findMany({
            where: {
                groupId,
                OR: [
                    ...(membership.unitId ? [{ unitId: membership.unitId }] : []),
                    { memberId: membership.id },
                ],
            },
            include: {
                items: true,
                unit: { select: { id: true, name: true } },
                payments: {
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getBillDetail(groupId, billId) {
        const bill = await this.prisma.bill.findFirst({
            where: { id: billId, groupId },
            include: {
                items: true,
                unit: {
                    include: {
                        occupants: {
                            where: { status: MembershipStatus.APPROVED },
                            select: { user: { select: { fullName: true, phone: true } } },
                        },
                    },
                },
                member: {
                    include: {
                        user: { select: { fullName: true, phone: true, email: true } },
                    },
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        payer: { select: { fullName: true } },
                        verifiedBy: { select: { fullName: true } },
                    },
                },
            },
        });
        if (!bill) {
            throw new NotFoundException('Tagihan tidak ditemukan');
        }
        const config = await this.prisma.groupPaymentConfig.findUnique({
            where: { groupId },
        });
        let qrisOption = null;
        if (config?.qrisEnabled && bill.status !== BillStatus.PAID) {
            if (config.rawQrString && config.rawQrString.startsWith('000201')) {
                try {
                    const dynamicString = this.qrisService.convertToDynamic(config.rawQrString, bill.totalAmount);
                    const qrDataUrl = await this.qrisService.generateQrDataUrl(dynamicString);
                    qrisOption = {
                        rawString: dynamicString,
                        qrDataUrl,
                        imageUrl: config.qrisImageUrl || qrDataUrl,
                        amount: bill.totalAmount,
                        merchantName: config.merchantName || undefined,
                    };
                }
                catch {
                    if (config.qrisImageUrl) {
                        qrisOption = {
                            imageUrl: config.qrisImageUrl,
                            amount: bill.totalAmount,
                            merchantName: config.merchantName || undefined,
                        };
                    }
                }
            }
            else if (config.qrisImageUrl) {
                qrisOption = {
                    imageUrl: config.qrisImageUrl,
                    amount: bill.totalAmount,
                    merchantName: config.merchantName || undefined,
                };
            }
        }
        return {
            bill,
            paymentOptions: {
                qris: qrisOption,
                bank: config?.bankEnabled
                    ? {
                        bankName: config.bankName,
                        accountNumber: config.accountNumber,
                        accountHolder: config.accountHolder,
                        accountDetails: config.accountDetails || config.instructions,
                    }
                    : null,
                cashEnabled: config?.cashEnabled ?? true,
                instructions: config?.instructions,
            },
        };
    }
    async submitPayment(groupId, billId, userId, dto) {
        const bill = await this.prisma.bill.findFirst({
            where: { id: billId, groupId },
        });
        if (!bill) {
            throw new NotFoundException('Tagihan tidak ditemukan');
        }
        if (bill.status === BillStatus.PAID) {
            throw new ConflictException('Tagihan ini sudah lunas');
        }
        return this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    billId: bill.id,
                    payerId: userId,
                    method: dto.method,
                    amount: bill.totalAmount,
                    proofImageUrl: dto.proofImageUrl,
                    notes: dto.notes,
                    status: PaymentStatus.PENDING,
                },
            });
            await tx.bill.update({
                where: { id: bill.id },
                data: { status: BillStatus.PENDING_VERIFICATION },
            });
            return {
                message: 'Konfirmasi pembayaran berhasil dikirim. Menunggu verifikasi pengurus.',
                paymentId: payment.id,
                status: payment.status,
            };
        });
    }
    async verifyPayment(groupId, billId, paymentId, adminUserId, dto) {
        const bill = await this.prisma.bill.findFirst({
            where: { id: billId, groupId },
            include: {
                unit: true,
                member: { include: { user: true } },
            },
        });
        if (!bill) {
            throw new NotFoundException('Tagihan tidak ditemukan');
        }
        const payment = await this.prisma.payment.findFirst({
            where: { id: paymentId, billId },
        });
        if (!payment) {
            throw new NotFoundException('Data pembayaran tidak ditemukan');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: dto.status,
                    verifiedById: adminUserId,
                    verifiedAt: new Date(),
                    notes: dto.notes,
                },
            });
            if (dto.status === PaymentStatus.SUCCESS) {
                await tx.bill.update({
                    where: { id: bill.id },
                    data: { status: BillStatus.PAID },
                });
                const targetLabel = bill.unit ? bill.unit.name : bill.member?.user.fullName;
                await tx.cashLedger.create({
                    data: {
                        groupId,
                        type: CashFlowType.INCOME,
                        amount: payment.amount,
                        category: 'Penerimaan Iuran',
                        description: `Pembayaran ${bill.title}${targetLabel ? ` - ${targetLabel}` : ''}`,
                        paymentId: payment.id,
                        receiptUrl: payment.proofImageUrl,
                    },
                });
                await tx.auditLog.create({
                    data: {
                        groupId,
                        userId: adminUserId,
                        action: 'VERIFY_PAYMENT_APPROVED',
                        details: {
                            billId: bill.id,
                            billTitle: bill.title,
                            paymentId: payment.id,
                            amount: payment.amount,
                            method: payment.method,
                            payerId: payment.payerId,
                        },
                    },
                });
                return {
                    message: 'Pembayaran disetujui. Tagihan berstatus Lunas dan otomatis tercatat di Buku Kas Komunitas.',
                    status: PaymentStatus.SUCCESS,
                    billStatus: BillStatus.PAID,
                };
            }
            else {
                await tx.bill.update({
                    where: { id: bill.id },
                    data: { status: BillStatus.UNPAID },
                });
                await tx.auditLog.create({
                    data: {
                        groupId,
                        userId: adminUserId,
                        action: 'VERIFY_PAYMENT_REJECTED',
                        details: {
                            billId: bill.id,
                            billTitle: bill.title,
                            paymentId: payment.id,
                            amount: payment.amount,
                            notes: dto.notes,
                        },
                    },
                });
                return {
                    message: 'Pembayaran ditolak. Status tagihan dikembalikan menjadi Belum Lunas.',
                    status: PaymentStatus.REJECTED,
                    billStatus: BillStatus.UNPAID,
                };
            }
        });
    }
};
BillingService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        QrisService])
], BillingService);
export { BillingService };
//# sourceMappingURL=billing.service.js.map