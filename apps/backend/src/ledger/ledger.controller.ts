import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRoles } from '../groups/decorators/roles.decorator.js';
import { GroupRolesGuard } from '../groups/guards/group-roles.guard.js';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto.js';
import { QueryLedgerDto } from './dto/query-ledger.dto.js';
import { LedgerService } from './ledger.service.js';

@Controller('groups/:groupId')
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  // 1. Dilihat oleh seluruh anggota grup (Transparansi Kas Terbuka)
  @Get('ledger')
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER)
  async getLedger(
    @Param('groupId') groupId: string,
    @Query() query: QueryLedgerDto,
  ) {
    return this.ledgerService.getLedger(groupId, query);
  }

  // 2. Pencatatan Pengeluaran Kas (Hanya Pengurus / Admin / Owner)
  @Post('ledger/expense')
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async recordExpense(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLedgerEntryDto,
  ) {
    return this.ledgerService.recordExpense(groupId, userId, dto);
  }

  // 3. Pencatatan Pemasukan Kas Manual (Hibah, Donasi, Sisa Kas Periode Lalu)
  @Post('ledger/income')
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async recordIncome(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLedgerEntryDto,
  ) {
    return this.ledgerService.recordIncome(groupId, userId, dto);
  }

  // 4. Hapus catatan kas manual yang salah input (Hanya Pengurus)
  @Delete('ledger/:entryId')
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async deleteEntry(
    @Param('groupId') groupId: string,
    @Param('entryId') entryId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ledgerService.deleteLedgerEntry(groupId, entryId, userId);
  }

  // 5. Audit Trail log aktivitas grup
  @Get('audit-logs')
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async getAuditLogs(
    @Param('groupId') groupId: string,
    @Query('limit') limit?: number,
  ) {
    return this.ledgerService.getAuditLogs(groupId, limit ? Number(limit) : 50);
  }
}
