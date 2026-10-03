import { BillStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { QrisService } from '../qris/qris.service.js';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto.js';
import { CreateBillDto } from './dto/create-bill.dto.js';
import { SubmitPaymentDto } from './dto/submit-payment.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';
export declare class BillingService {
    private readonly prisma;
    private readonly qrisService;
    constructor(prisma: PrismaService, qrisService: QrisService);
    getPaymentConfig(groupId: string): Promise<{
        id: string;
        updatedAt: Date;
        groupId: string;
        qrisEnabled: boolean;
        qrisImageUrl: string | null;
        rawQrString: string | null;
        merchantName: string | null;
        bankEnabled: boolean;
        bankName: string | null;
        accountNumber: string | null;
        accountHolder: string | null;
        accountDetails: string | null;
        cashEnabled: boolean;
        instructions: string | null;
    }>;
    updatePaymentConfig(groupId: string, dto: UpdatePaymentConfigDto): Promise<{
        message: string;
        config: {
            id: string;
            updatedAt: Date;
            groupId: string;
            qrisEnabled: boolean;
            qrisImageUrl: string | null;
            rawQrString: string | null;
            merchantName: string | null;
            bankEnabled: boolean;
            bankName: string | null;
            accountNumber: string | null;
            accountHolder: string | null;
            accountDetails: string | null;
            cashEnabled: boolean;
            instructions: string | null;
        };
    }>;
    createBill(groupId: string, dto: CreateBillDto): Promise<{
        message: string;
        totalBills: number;
        totalAmountPerBill: number;
        bill?: undefined;
    } | {
        message: string;
        bill: {
            unit: {
                id: string;
                createdAt: Date;
                name: string;
                groupId: string;
                description: string | null;
            } | null;
            items: {
                id: string;
                name: string;
                amount: number;
                billId: string;
            }[];
            member: ({
                user: {
                    fullName: string;
                    email: string | null;
                    phone: string | null;
                };
            } & {
                id: string;
                role: import("@prisma/client").$Enums.MemberRole;
                groupId: string;
                userId: string;
                status: import("@prisma/client").$Enums.MembershipStatus;
                isActive: boolean;
                joinedAt: Date;
                unitId: string | null;
            }) | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            groupId: string;
            status: import("@prisma/client").$Enums.BillStatus;
            unitId: string | null;
            memberId: string | null;
            title: string;
            period: string | null;
            dueDate: Date | null;
            totalAmount: number;
        };
        totalBills?: undefined;
        totalAmountPerBill?: undefined;
    }>;
    getGroupBills(groupId: string, status?: BillStatus): Promise<({
        unit: {
            id: string;
            name: string;
        } | null;
        items: {
            id: string;
            name: string;
            amount: number;
            billId: string;
        }[];
        member: {
            user: {
                fullName: string;
                phone: string | null;
            };
            id: string;
        } | null;
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PaymentStatus;
            amount: number;
            method: import("@prisma/client").$Enums.PaymentMethod;
            proofImageUrl: string | null;
            notes: string | null;
            verifiedAt: Date | null;
            billId: string;
            payerId: string;
            verifiedById: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        groupId: string;
        status: import("@prisma/client").$Enums.BillStatus;
        unitId: string | null;
        memberId: string | null;
        title: string;
        period: string | null;
        dueDate: Date | null;
        totalAmount: number;
    })[]>;
    getMyBills(groupId: string, userId: string): Promise<({
        unit: {
            id: string;
            name: string;
        } | null;
        items: {
            id: string;
            name: string;
            amount: number;
            billId: string;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.PaymentStatus;
            amount: number;
            method: import("@prisma/client").$Enums.PaymentMethod;
            proofImageUrl: string | null;
            notes: string | null;
            verifiedAt: Date | null;
            billId: string;
            payerId: string;
            verifiedById: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        groupId: string;
        status: import("@prisma/client").$Enums.BillStatus;
        unitId: string | null;
        memberId: string | null;
        title: string;
        period: string | null;
        dueDate: Date | null;
        totalAmount: number;
    })[]>;
    getBillDetail(groupId: string, billId: string): Promise<{
        bill: {
            unit: ({
                occupants: {
                    user: {
                        fullName: string;
                        phone: string | null;
                    };
                }[];
            } & {
                id: string;
                createdAt: Date;
                name: string;
                groupId: string;
                description: string | null;
            }) | null;
            items: {
                id: string;
                name: string;
                amount: number;
                billId: string;
            }[];
            member: ({
                user: {
                    fullName: string;
                    email: string | null;
                    phone: string | null;
                };
            } & {
                id: string;
                role: import("@prisma/client").$Enums.MemberRole;
                groupId: string;
                userId: string;
                status: import("@prisma/client").$Enums.MembershipStatus;
                isActive: boolean;
                joinedAt: Date;
                unitId: string | null;
            }) | null;
            payments: ({
                payer: {
                    fullName: string;
                };
                verifiedBy: {
                    fullName: string;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.PaymentStatus;
                amount: number;
                method: import("@prisma/client").$Enums.PaymentMethod;
                proofImageUrl: string | null;
                notes: string | null;
                verifiedAt: Date | null;
                billId: string;
                payerId: string;
                verifiedById: string | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            groupId: string;
            status: import("@prisma/client").$Enums.BillStatus;
            unitId: string | null;
            memberId: string | null;
            title: string;
            period: string | null;
            dueDate: Date | null;
            totalAmount: number;
        };
        paymentOptions: {
            qris: {
                rawString?: string;
                qrDataUrl?: string;
                imageUrl?: string;
                amount: number;
                merchantName?: string;
            } | null;
            bank: {
                bankName: string | null;
                accountNumber: string | null;
                accountHolder: string | null;
                accountDetails: string | null;
            } | null;
            cashEnabled: boolean;
            instructions: string | null | undefined;
        };
    }>;
    submitPayment(groupId: string, billId: string, userId: string, dto: SubmitPaymentDto): Promise<{
        message: string;
        paymentId: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
    }>;
    verifyPayment(groupId: string, billId: string, paymentId: string, adminUserId: string, dto: VerifyPaymentDto): Promise<{
        message: string;
        status: "SUCCESS";
        billStatus: "PAID";
    } | {
        message: string;
        status: "REJECTED";
        billStatus: "UNPAID";
    }>;
}
