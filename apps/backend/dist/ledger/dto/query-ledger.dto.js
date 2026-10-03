var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEnum, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CashFlowType } from '@prisma/client';
export class QueryLedgerDto {
    type;
    category;
    period;
    startDate;
    endDate;
    page = 1;
    limit = 20;
}
__decorate([
    IsOptional(),
    IsEnum(CashFlowType, { message: 'Tipe arus kas harus INCOME atau EXPENSE' }),
    __metadata("design:type", String)
], QueryLedgerDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], QueryLedgerDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], QueryLedgerDto.prototype, "period", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], QueryLedgerDto.prototype, "startDate", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], QueryLedgerDto.prototype, "endDate", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    IsPositive(),
    __metadata("design:type", Number)
], QueryLedgerDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    IsPositive(),
    __metadata("design:type", Number)
], QueryLedgerDto.prototype, "limit", void 0);
//# sourceMappingURL=query-ledger.dto.js.map