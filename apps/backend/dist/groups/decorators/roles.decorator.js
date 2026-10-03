import { SetMetadata } from '@nestjs/common';
export const GROUP_ROLES_KEY = 'group_roles';
export const GroupRoles = (...roles) => SetMetadata(GROUP_ROLES_KEY, roles);
//# sourceMappingURL=roles.decorator.js.map