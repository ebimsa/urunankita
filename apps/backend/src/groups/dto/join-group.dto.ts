import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode grup (join code) wajib diisi' })
  joinCode: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID unit tidak valid' })
  unitId?: string;

  @IsOptional()
  @IsString({ message: 'Nama unit harus berupa teks' })
  unitName?: string;
}
