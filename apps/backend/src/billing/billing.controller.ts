import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BillStatus, MemberRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { GroupRolesGuard } from '../groups/guards/group-roles.guard.js';
import { GroupRoles } from '../groups/decorators/roles.decorator.js';
import { BillingService } from './billing.service.js';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto.js';
import { CreateBillDto } from './dto/create-bill.dto.js';
import { SubmitPaymentDto } from './dto/submit-payment.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';

@Controller('groups/:groupId')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // =========================================================================
  // KONFIGURASI PEMBAYARAN PENGURUS
  // =========================================================================

  @Get('payment-config')
  async getPaymentConfig(@Param('groupId') groupId: string) {
    return this.billingService.getPaymentConfig(groupId);
  }

  @Put('payment-config')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async updatePaymentConfig(
    @Param('groupId') groupId: string,
    @Body() dto: UpdatePaymentConfigDto,
  ) {
    return this.billingService.updatePaymentConfig(groupId, dto);
  }

  // =========================================================================
  // PENERBITAN & DAFTAR TAGIHAN
  // =========================================================================

  @Post('bills')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createBill(
    @Param('groupId') groupId: string,
    @Body() dto: CreateBillDto,
  ) {
    return this.billingService.createBill(groupId, dto);
  }

  @Get('bills')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async getGroupBills(
    @Param('groupId') groupId: string,
    @Query('status') status?: BillStatus,
  ) {
    return this.billingService.getGroupBills(groupId, status);
  }

  @Get('bills/my')
  async getMyBills(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.billingService.getMyBills(groupId, userId);
  }

  @Get('bills/:billId')
  async getBillDetail(
    @Param('groupId') groupId: string,
    @Param('billId') billId: string,
  ) {
    return this.billingService.getBillDetail(groupId, billId);
  }

  // =========================================================================
  // PEMBAYARAN & VERIFIKASI
  // =========================================================================

  @Post('bills/:billId/pay')
  @HttpCode(HttpStatus.OK)
  async submitPayment(
    @Param('groupId') groupId: string,
    @Param('billId') billId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitPaymentDto,
  ) {
    return this.billingService.submitPayment(groupId, billId, userId, dto);
  }

  @Patch('bills/:billId/payments/:paymentId/verify')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async verifyPayment(
    @Param('groupId') groupId: string,
    @Param('billId') billId: string,
    @Param('paymentId') paymentId: string,
    @CurrentUser('id') adminUserId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.billingService.verifyPayment(
      groupId,
      billId,
      paymentId,
      adminUserId,
      dto,
    );
  }
}
