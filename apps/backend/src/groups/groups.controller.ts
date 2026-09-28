import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { JoinGroupDto } from './dto/join-group.dto.js';
import { CreateUnitDto } from './dto/create-unit.dto.js';
import { CreateUnitsBulkDto } from './dto/create-units-bulk.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
import { GroupRolesGuard } from './guards/group-roles.guard.js';
import { GroupRoles } from './decorators/roles.decorator.js';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupsService.create(userId, dto);
  }

  @Get('my')
  async getMyGroups(@CurrentUser('id') userId: string) {
    return this.groupsService.getMyGroups(userId);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  async joinGroup(
    @CurrentUser('id') userId: string,
    @Body() dto: JoinGroupDto,
  ) {
    return this.groupsService.joinGroup(userId, dto);
  }

  @Get('preview/:joinCode')
  async previewGroupByJoinCode(@Param('joinCode') joinCode: string) {
    return this.groupsService.previewGroupByJoinCode(joinCode);
  }

  @Get(':groupId')
  async getGroupById(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.getGroupById(groupId, userId);
  }

  // --- UNIT HUNIAN ---
  @Post(':groupId/units')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async createUnit(
    @Param('groupId') groupId: string,
    @Body() dto: CreateUnitDto,
  ) {
    return this.groupsService.createUnit(groupId, dto);
  }

  @Post(':groupId/units/bulk')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async createUnitsBulk(
    @Param('groupId') groupId: string,
    @Body() dto: CreateUnitsBulkDto,
  ) {
    return this.groupsService.createUnitsBulk(groupId, dto);
  }

  @Get(':groupId/units')
  async getUnits(@Param('groupId') groupId: string) {
    return this.groupsService.getUnits(groupId);
  }

  // --- ANGGOTA & PERSETUJUAN ---
  @Get(':groupId/members')
  async getMembers(@Param('groupId') groupId: string) {
    return this.groupsService.getMembers(groupId);
  }

  @Get(':groupId/members/pending')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async getPendingMembers(@Param('groupId') groupId: string) {
    return this.groupsService.getPendingMembers(groupId);
  }

  @Patch(':groupId/members/:memberId/approve')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async approveMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupsService.approveMember(groupId, memberId);
  }

  @Patch(':groupId/members/:memberId/reject')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async rejectMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupsService.rejectMember(groupId, memberId);
  }

  @Patch(':groupId/members/:memberId/role')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER)
  async updateMemberRole(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.groupsService.updateMemberRole(groupId, memberId, dto.role);
  }

  @Delete(':groupId/members/:memberId')
  @UseGuards(GroupRolesGuard)
  @GroupRoles(MemberRole.OWNER, MemberRole.ADMIN)
  async removeMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupsService.removeMember(groupId, memberId);
  }
}
