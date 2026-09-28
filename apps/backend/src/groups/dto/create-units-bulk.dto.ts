import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateUnitsBulkDto {
  @IsArray({ message: 'Daftar nama unit harus berupa array' })
  @ArrayMinSize(1, { message: 'Minimal harus ada 1 nama unit' })
  @IsString({ each: true, message: 'Setiap nama unit harus berupa teks' })
  @IsNotEmpty({ each: true, message: 'Nama unit tidak boleh kosong' })
  names: string[];
}
