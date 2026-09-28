import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '@prisma/client';

export const GROUP_ROLES_KEY = 'group_roles';
export const GroupRoles = (...roles: MemberRole[]) => SetMetadata(GROUP_ROLES_KEY, roles);
