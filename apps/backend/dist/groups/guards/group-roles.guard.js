var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ForbiddenException, Injectable, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GROUP_ROLES_KEY } from '../decorators/roles.decorator.js';
let GroupRolesGuard = class GroupRolesGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(GROUP_ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new ForbiddenException('Akses ditolak: Pengguna belum terautentikasi');
        }
        const groupId = request.params.groupId || request.body.groupId;
        if (!groupId) {
            return true;
        }
        const membership = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: user.id,
                },
            },
        });
        if (!membership || !membership.isActive) {
            throw new ForbiddenException('Akses ditolak: Anda bukan anggota aktif dari grup ini');
        }
        if (!requiredRoles.includes(membership.role)) {
            throw new ForbiddenException(`Akses ditolak: Fitur ini membutuhkan peran ${requiredRoles.join(' atau ')}`);
        }
        request.membership = membership;
        return true;
    }
};
GroupRolesGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector,
        PrismaService])
], GroupRolesGuard);
export { GroupRolesGuard };
//# sourceMappingURL=group-roles.guard.js.map