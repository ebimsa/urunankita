import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BillItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama item rincian wajib diisi' })
  name: string;

  @IsInt()
  @Min(1, { message: 'Nominal item minimal Rp 1' })
  amount: number;
}

export class CreateBillDto {
  @IsString()
  @IsNotEmpty({ message: 'Judul tagihan wajib diisi' })
  title: string;

  @IsOptional()
  @IsString()
  period?: string; // Format: "2026-10"

  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal jatuh tempo tidak valid' })
  dueDate?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID unit tidak valid' })
  unitId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID anggota tidak valid' })
  memberId?: string;

  @IsOptional()
  @IsBoolean()
  applyToAll?: boolean; // Jika true, tagihan dibuat massal untuk seluruh unit/anggota

  @IsArray({ message: 'Rincian biaya (items) harus berupa array' })
  @ArrayMinSize(1, { message: 'Minimal harus ada 1 item rincian biaya' })
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];
}
