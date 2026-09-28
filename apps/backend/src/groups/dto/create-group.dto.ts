import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { GroupType } from '@prisma/client';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama grup wajib diisi' })
  @MinLength(3, { message: 'Nama grup minimal 3 karakter' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(GroupType, { message: 'Tipe grup harus PHYSICAL_UNIT atau DIRECT_MEMBER' })
  type: GroupType;
}
