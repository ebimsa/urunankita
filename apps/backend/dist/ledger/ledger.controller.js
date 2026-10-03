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
import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRoles } from '../groups/decorators/roles.decorator.js';
import { GroupRolesGuard } from '../groups/guards/group-roles.guard.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { QueryLedgerDto } from './dto/query-ledger.dto.js';
import { LedgerService } from './ledger.service.js';
let LedgerController = class LedgerController {
    ledgerService;
    constructor(ledgerService) {
        this.ledgerService = ledgerService;
    }
    async getLedger(groupId, query) {
        return this.ledgerService.getLedger(groupId, query);
    }
    async recordExpense(groupId, userId, dto) {
        return this.ledgerService.recordExpense(groupId, userId, dto);
    }
    async recordIncome(groupId, userId, dto) {
        return this.ledgerService.recordIncome(groupId, userId, dto);
    }
    async deleteEntry(groupId, entryId, userId) {
        return this.ledgerService.deleteLedgerEntry(groupId, entryId, userId);
    }
    async getAuditLogs(groupId, limit) {
        return this.ledgerService.getAuditLogs(groupId, limit ? Number(limit) : 50);
    }
};
__decorate([
    Get('ledger'),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER),
    __param(0, Param('groupId')),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, QueryLedgerDto]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "getLedger", null);
__decorate([
    Post('ledger/expense'),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, CreateLedgerEntryDto]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "recordExpense", null);
__decorate([
    Post('ledger/income'),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, CurrentUser('id')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, CreateLedgerEntryDto]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "recordIncome", null);
__decorate([
    Delete('ledger/:entryId'),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Param('entryId')),
    __param(2, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "deleteEntry", null);
__decorate([
    Get('audit-logs'),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "getAuditLogs", null);
LedgerController = __decorate([
    Controller('groups/:groupId'),
    UseGuards(JwtAuthGuard, GroupRolesGuard),
    __metadata("design:paramtypes", [LedgerService])
], LedgerController);
export { LedgerController };
//# sourceMappingURL=ledger.controller.js.map