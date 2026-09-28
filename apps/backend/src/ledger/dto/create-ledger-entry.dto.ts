import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateLedgerEntryDto {
  @IsInt({ message: 'Nominal harus berupa angka bulat' })
  @IsPositive({ message: 'Nominal harus lebih dari 0' })
  amount: number;

  @IsString({ message: 'Kategori harus berupa teks' })
  @IsNotEmpty({ message: 'Kategori tidak boleh kosong' })
  category: string;

  @IsString({ message: 'Keterangan harus berupa teks' })
  @IsNotEmpty({ message: 'Keterangan tidak boleh kosong' })
  description: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  entryDate?: string;
}
