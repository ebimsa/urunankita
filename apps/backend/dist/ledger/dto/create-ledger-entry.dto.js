var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
export class CreateLedgerEntryDto {
    amount;
    category;
    description;
    receiptUrl;
    entryDate;
}
__decorate([
    IsInt({ message: 'Nominal harus berupa angka bulat' }),
    IsPositive({ message: 'Nominal harus lebih dari 0' }),
    __metadata("design:type", Number)
], CreateLedgerEntryDto.prototype, "amount", void 0);
__decorate([
    IsString({ message: 'Kategori harus berupa teks' }),
    IsNotEmpty({ message: 'Kategori tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "category", void 0);
__decorate([
    IsString({ message: 'Keterangan harus berupa teks' }),
    IsNotEmpty({ message: 'Keterangan tidak boleh kosong' }),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "receiptUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateLedgerEntryDto.prototype, "entryDate", void 0);
//# sourceMappingURL=create-ledger-entry.dto.js.map