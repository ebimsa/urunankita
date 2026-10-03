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
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, } from '@nestjs/common';
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
let GroupsController = class GroupsController {
    groupsService;
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async createGroup(userId, dto) {
        return this.groupsService.create(userId, dto);
    }
    async getMyGroups(userId) {
        return this.groupsService.getMyGroups(userId);
    }
    async joinGroup(userId, dto) {
        return this.groupsService.joinGroup(userId, dto);
    }
    async previewGroupByJoinCode(joinCode) {
        return this.groupsService.previewGroupByJoinCode(joinCode);
    }
    async getGroupById(groupId, userId) {
        return this.groupsService.getGroupById(groupId, userId);
    }
    async createUnit(groupId, dto) {
        return this.groupsService.createUnit(groupId, dto);
    }
    async createUnitsBulk(groupId, dto) {
        return this.groupsService.createUnitsBulk(groupId, dto);
    }
    async getUnits(groupId) {
        return this.groupsService.getUnits(groupId);
    }
    async deleteUnit(groupId, unitId) {
        return this.groupsService.deleteUnit(groupId, unitId);
    }
    async getMembers(groupId) {
        return this.groupsService.getMembers(groupId);
    }
    async getPendingMembers(groupId) {
        return this.groupsService.getPendingMembers(groupId);
    }
    async approveMember(groupId, memberId) {
        return this.groupsService.approveMember(groupId, memberId);
    }
    async rejectMember(groupId, memberId) {
        return this.groupsService.rejectMember(groupId, memberId);
    }
    async updateMemberRole(groupId, memberId, dto) {
        return this.groupsService.updateMemberRole(groupId, memberId, dto.role);
    }
    async removeMember(groupId, memberId) {
        return this.groupsService.removeMember(groupId, memberId);
    }
    async leaveGroup(groupId, userId) {
        return this.groupsService.leaveGroup(groupId, userId);
    }
    async getAuditLogs(groupId, limit) {
        const take = limit ? parseInt(limit, 10) || 50 : 50;
        return this.groupsService.getAuditLogs(groupId, take);
    }
};
__decorate([
    Post(),
    HttpCode(HttpStatus.CREATED),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "createGroup", null);
__decorate([
    Get('my'),
    __param(0, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getMyGroups", null);
__decorate([
    Post('join'),
    HttpCode(HttpStatus.OK),
    __param(0, CurrentUser('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, JoinGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "joinGroup", null);
__decorate([
    Get('preview/:joinCode'),
    __param(0, Param('joinCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "previewGroupByJoinCode", null);
__decorate([
    Get(':groupId'),
    __param(0, Param('groupId')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getGroupById", null);
__decorate([
    Post(':groupId/units'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateUnitDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "createUnit", null);
__decorate([
    Post(':groupId/units/bulk'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateUnitsBulkDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "createUnitsBulk", null);
__decorate([
    Get(':groupId/units'),
    __param(0, Param('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getUnits", null);
__decorate([
    Delete(':groupId/units/:unitId'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Param('unitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "deleteUnit", null);
__decorate([
    Get(':groupId/members'),
    __param(0, Param('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getMembers", null);
__decorate([
    Get(':groupId/members/pending'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getPendingMembers", null);
__decorate([
    Patch(':groupId/members/:memberId/approve'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Param('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "approveMember", null);
__decorate([
    Patch(':groupId/members/:memberId/reject'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Param('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "rejectMember", null);
__decorate([
    Patch(':groupId/members/:memberId/role'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER),
    __param(0, Param('groupId')),
    __param(1, Param('memberId')),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateMemberRoleDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateMemberRole", null);
__decorate([
    Delete(':groupId/members/:memberId'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Param('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "removeMember", null);
__decorate([
    Delete(':groupId/leave'),
    HttpCode(HttpStatus.OK),
    __param(0, Param('groupId')),
    __param(1, CurrentUser('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "leaveGroup", null);
__decorate([
    Get(':groupId/audit-logs'),
    UseGuards(GroupRolesGuard),
    GroupRoles(MemberRole.OWNER, MemberRole.ADMIN),
    __param(0, Param('groupId')),
    __param(1, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getAuditLogs", null);
GroupsController = __decorate([
    Controller('groups'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [GroupsService])
], GroupsController);
export { GroupsController };
//# sourceMappingURL=groups.controller.js.map