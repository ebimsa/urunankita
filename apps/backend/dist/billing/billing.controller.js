var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards, } from '@nestjs/common';
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
let BillingController = class BillingController {
    billingService;
    constructor(billingService) {
        this.billingService = billingService;
    }
    async getPaymentConfig(groupId) {
        return this.billingService.getPaymentConfig(groupId);
    }
    async updatePaymentConfig(groupId, dto) {
        return this.billingService.updatePaymentConfig(groupId, dto);
    }
    async createBill(groupId, dto) {
        return this.billingService.createBill(groupId, dto);
    }
    async getGroupBills(groupId, status) {
        return this.billingService.getGroupBills(groupId, status);
    }
    async getMyBills(groupId, userId) {
        return this.billingService.getMyBills(groupId, userId);
    }
    async getBillDetail(groupId, billId) {
        return this.billingService.getBillDetail(groupId, billId);
    }
    async submitPayment(groupId, billId, userId, dto) {
        return this.billingService.submitPayment(groupId, billId, userId, dto);
    }
    async verifyPayment(groupId, billId, paymentId, adminUserId, dto) {
        return this.billingService.verifyPayment(groupId, billId, paymentId, adminUserId, dto);
    }
};
__decorate([
    Get('payment-config'),
    __param(0, Param('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getPaymentConfig", null);
__decorate([
    Put('payment-config'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdatePaymentConfigDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "updatePaymentConfig", null);
__decorate([
    Post('bills'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    HttpCode(HttpStatus.CREATED),
    __param(0, Param('groupId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateBillDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createBill", null);
__decorate([
    Get('bills'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Query('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getGroupBills", null);
__decorate([
    Get('bills/my'),
    __param(0, Param('groupId')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getMyBills", null);
__decorate([
    Get('bills/:billId'),
    __param(0, Param('groupId')),
    __param(1, Param('billId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getBillDetail", null);
__decorate([
    Post('bills/:billId/pay'),
    HttpCode(HttpStatus.OK),
    __param(0, Param('groupId')),
    __param(1, Param('billId')),
    __param(2, CurrentUser('id')),
    __param(3, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, SubmitPaymentDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "submitPayment", null);
__decorate([
    Patch('bills/:billId/payments/:paymentId/verify'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Param('billId')),
    __param(2, Param('paymentId')),
    __param(3, CurrentUser('id')),
    __param(4, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, VerifyPaymentDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "verifyPayment", null);
BillingController = __decorate([
    Controller('groups/:groupId'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [BillingService])
], BillingController);
export { BillingController };
//# sourceMappingURL=billing.controller.js.map