import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  BillStatus,
  CashFlowType,
  GroupType,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { BillingService } from './billing.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { QrisService } from '../qris/qris.service.js';

describe('BillingService', () => {
  let service: BillingService;

  const mockPrisma = {
    groupPaymentConfig: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    group: {
      findUnique: vi.fn(),
    },
    groupUnit: {
      findMany: vi.fn(),
    },
    groupMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    bill: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    cashLedger: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const mockQrisService = {
    validateQris: vi.fn(),
    parseQris: vi.fn(),
    generateDynamicQris: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default $transaction behavior: handle both batch array of promises and interactive callback
    mockPrisma.$transaction.mockImplementation((arg: any) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg(mockPrisma);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QrisService, useValue: mockQrisService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('getPaymentConfig', () => {
    it('harus mengembalikan konfigurasi yang sudah ada jika ditemukan', async () => {
      const existingConfig = {
        id: 'cfg-1',
        groupId: 'grp-1',
        bankEnabled: true,
        bankName: 'BCA',
      };
      mockPrisma.groupPaymentConfig.findUnique.mockResolvedValue(existingConfig);

      const result = await service.getPaymentConfig('grp-1');

      expect(result).toEqual(existingConfig);
      expect(mockPrisma.groupPaymentConfig.findUnique).toHaveBeenCalledWith({
        where: { groupId: 'grp-1' },
      });
      expect(mockPrisma.groupPaymentConfig.create).not.toHaveBeenCalled();
    });

    it('harus membuat konfigurasi default baru jika belum pernah diset', async () => {
      mockPrisma.groupPaymentConfig.findUnique.mockResolvedValue(null);
      const newConfig = {
        id: 'cfg-new',
        groupId: 'grp-1',
        cashEnabled: true,
      };
      mockPrisma.groupPaymentConfig.create.mockResolvedValue(newConfig);

      const result = await service.getPaymentConfig('grp-1');

      expect(result).toEqual(newConfig);
      expect(mockPrisma.groupPaymentConfig.create).toHaveBeenCalledWith({
        data: {
          groupId: 'grp-1',
          cashEnabled: true,
        },
      });
    });
  });

  describe('createBill', () => {
    it('harus melempar BadRequestException jika unitId tidak disertakan pada grup PHYSICAL_UNIT non-massal', async () => {
      mockPrisma.group.findUnique.mockResolvedValue({
        id: 'grp-1',
        type: GroupType.PHYSICAL_UNIT,
      });

      await expect(
        service.createBill('grp-1', {
          title: 'Iuran Satuan',
          items: [{ name: 'Biaya', amount: 50000 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('harus melempar NotFoundException jika grup tidak ditemukan', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(null);

      await expect(
        service.createBill('grp-not-found', {
          title: 'Iuran Bulanan',
          items: [{ name: 'Keamanan', amount: 50000 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('harus berhasil menerbitkan tagihan massal untuk seluruh unit', async () => {
      mockPrisma.group.findUnique.mockResolvedValue({
        id: 'grp-1',
        type: GroupType.PHYSICAL_UNIT,
      });
      mockPrisma.groupUnit.findMany.mockResolvedValue([
        { id: 'unit-1', name: 'A-01' },
        { id: 'unit-2', name: 'A-02' },
      ]);
      mockPrisma.bill.create.mockImplementation(({ data }: any) => ({
        id: `bill-${data.unitId}`,
        ...data,
      }));

      const result = await service.createBill('grp-1', {
        title: 'Iuran Warga Oktober',
        applyToAll: true,
        items: [{ name: 'Kebersihan', amount: 50000 }],
      });

      expect(result.totalBills).toBe(2);
      expect(result.totalAmountPerBill).toBe(50000);
    });
  });

  describe('submitPayment', () => {
    it('harus melempar NotFoundException jika tagihan tidak ditemukan', async () => {
      mockPrisma.bill.findFirst.mockResolvedValue(null);

      await expect(
        service.submitPayment('grp-1', 'bill-999', 'user-1', {
          method: PaymentMethod.QRIS_DYNAMIC,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('harus melempar ConflictException jika tagihan sudah berstatus PAID', async () => {
      mockPrisma.bill.findFirst.mockResolvedValue({
        id: 'bill-1',
        groupId: 'grp-1',
        status: BillStatus.PAID,
        totalAmount: 100000,
      });

      await expect(
        service.submitPayment('grp-1', 'bill-1', 'user-1', {
          method: PaymentMethod.BANK_TRANSFER_MANUAL,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('harus berhasil menyimpan bukti bayar dan mengubah status tagihan ke PENDING_VERIFICATION', async () => {
      const mockBill = {
        id: 'bill-1',
        groupId: 'grp-1',
        status: BillStatus.UNPAID,
        totalAmount: 150000,
      };
      mockPrisma.bill.findFirst.mockResolvedValue(mockBill);
      mockPrisma.payment.create.mockResolvedValue({
        id: 'pay-1',
        billId: 'bill-1',
        payerId: 'user-1',
        amount: 150000,
        proofImageUrl: 'data:image/png;base64,mockproof',
        status: PaymentStatus.PENDING,
      });

      const result = await service.submitPayment('grp-1', 'bill-1', 'user-1', {
        method: PaymentMethod.BANK_TRANSFER_MANUAL,
        proofImageUrl: 'data:image/png;base64,mockproof',
        notes: 'Sudah ditransfer dari BCA Budi',
      });

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          billId: 'bill-1',
          payerId: 'user-1',
          method: PaymentMethod.BANK_TRANSFER_MANUAL,
          amount: 150000,
          proofImageUrl: 'data:image/png;base64,mockproof',
          notes: 'Sudah ditransfer dari BCA Budi',
          status: PaymentStatus.PENDING,
        }),
      });

      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { status: BillStatus.PENDING_VERIFICATION },
      });

      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.paymentId).toBe('pay-1');
    });
  });

  describe('verifyPayment', () => {
    it('harus melempar NotFoundException jika data pembayaran tidak ditemukan', async () => {
      mockPrisma.bill.findFirst.mockResolvedValue({
        id: 'bill-1',
        groupId: 'grp-1',
        title: 'Iuran',
      });
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyPayment('grp-1', 'bill-1', 'pay-999', 'admin-1', {
          status: PaymentStatus.SUCCESS,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('harus mengubah tagihan ke PAID, mencatat di CashLedger, dan menulis AuditLog saat SUCCESS', async () => {
      const mockBill = {
        id: 'bill-1',
        groupId: 'grp-1',
        title: 'Iuran Kebersihan',
        unit: { name: 'Blok A-01' },
      };
      const mockPayment = {
        id: 'pay-1',
        billId: 'bill-1',
        amount: 150000,
        proofImageUrl: 'https://storage/proof.jpg',
        payerId: 'user-budi',
        method: PaymentMethod.QRIS_DYNAMIC,
      };

      mockPrisma.bill.findFirst.mockResolvedValue(mockBill);
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);
      mockPrisma.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.SUCCESS,
      });

      const result = await service.verifyPayment(
        'grp-1',
        'bill-1',
        'pay-1',
        'admin-rt',
        { status: PaymentStatus.SUCCESS },
      );

      // Status tagihan harus jadi PAID
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { status: BillStatus.PAID },
      });

      // Harus tercatat di CashLedger sebagai INCOME beserta receiptUrl
      expect(mockPrisma.cashLedger.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          groupId: 'grp-1',
          type: CashFlowType.INCOME,
          amount: 150000,
          category: 'Penerimaan Iuran',
          receiptUrl: 'https://storage/proof.jpg',
          paymentId: 'pay-1',
        }),
      });

      // Harus menulis ke AuditLog
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          groupId: 'grp-1',
          userId: 'admin-rt',
          action: 'VERIFY_PAYMENT_APPROVED',
        }),
      });

      expect(result.status).toBe(PaymentStatus.SUCCESS);
      expect(result.billStatus).toBe(BillStatus.PAID);
    });

    it('harus mengembalikan status tagihan ke UNPAID saat verifikasi REJECTED', async () => {
      const mockBill = {
        id: 'bill-1',
        groupId: 'grp-1',
        title: 'Iuran Kebersihan',
        unit: { name: 'Blok A-01' },
      };
      const mockPayment = {
        id: 'pay-1',
        billId: 'bill-1',
        amount: 150000,
      };

      mockPrisma.bill.findFirst.mockResolvedValue(mockBill);
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await service.verifyPayment(
        'grp-1',
        'bill-1',
        'pay-1',
        'admin-rt',
        {
          status: PaymentStatus.REJECTED,
          notes: 'Nominal transfer tidak sesuai',
        },
      );

      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: { status: BillStatus.UNPAID },
      });

      expect(mockPrisma.cashLedger.create).not.toHaveBeenCalled();

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          groupId: 'grp-1',
          userId: 'admin-rt',
          action: 'VERIFY_PAYMENT_REJECTED',
        }),
      });

      expect(result.status).toBe(PaymentStatus.REJECTED);
      expect(result.billStatus).toBe(BillStatus.UNPAID);
    });
  });
});
