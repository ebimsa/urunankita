var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateNested, } from 'class-validator';
import { Type } from 'class-transformer';
export class BillItemDto {
    name;
    amount;
}
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Nama item rincian wajib diisi' }),
    __metadata("design:type", String)
], BillItemDto.prototype, "name", void 0);
__decorate([
    IsInt(),
    Min(1, { message: 'Nominal item minimal Rp 1' }),
    __metadata("design:type", Number)
], BillItemDto.prototype, "amount", void 0);
export class CreateBillDto {
    title;
    period;
    dueDate;
    unitId;
    memberId;
    applyToAll;
    items;
}
__decorate([
    IsString(),
    IsNotEmpty({ message: 'Judul tagihan wajib diisi' }),
    __metadata("design:type", String)
], CreateBillDto.prototype, "title", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateBillDto.prototype, "period", void 0);
__decorate([
    IsOptional(),
    IsDateString({}, { message: 'Format tanggal jatuh tempo tidak valid' }),
    __metadata("design:type", String)
], CreateBillDto.prototype, "dueDate", void 0);
__decorate([
    IsOptional(),
    IsUUID('4', { message: 'ID unit tidak valid' }),
    __metadata("design:type", String)
], CreateBillDto.prototype, "unitId", void 0);
__decorate([
    IsOptional(),
    IsUUID('4', { message: 'ID anggota tidak valid' }),
    __metadata("design:type", String)
], CreateBillDto.prototype, "memberId", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateBillDto.prototype, "applyToAll", void 0);
__decorate([
    IsArray({ message: 'Rincian biaya (items) harus berupa array' }),
    ArrayMinSize(1, { message: 'Minimal harus ada 1 item rincian biaya' }),
    ValidateNested({ each: true }),
    Type(() => BillItemDto),
    __metadata("design:type", Array)
], CreateBillDto.prototype, "items", void 0);
//# sourceMappingURL=create-bill.dto.js.map