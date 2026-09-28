import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama unit wajib diisi (contoh: Blok A-01 atau Kamar 03)' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
