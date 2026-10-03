import { MemberRole } from '@prisma/client';
export declare const GROUP_ROLES_KEY = "group_roles";
export declare const GroupRoles: (...roles: MemberRole[]) => import("@nestjs/common").CustomDecorator<string>;
