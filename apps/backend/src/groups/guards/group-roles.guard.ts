import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GROUP_ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class GroupRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(GROUP_ROLES_KEY, [
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
      throw new ForbiddenException(
        `Akses ditolak: Fitur ini membutuhkan peran ${requiredRoles.join(' atau ')}`,
      );
    }

    // Attach membership to request for controller convenience
    request.membership = membership;

    return true;
  }
}
