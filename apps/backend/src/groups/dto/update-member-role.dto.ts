import { IsEnum } from 'class-validator';
import { MemberRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(MemberRole, { message: 'Peran harus ADMIN atau MEMBER' })
  role: MemberRole;
}
