var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsBoolean, IsOptional, IsString } from 'class-validator';
export class UpdatePaymentConfigDto {
    qrisEnabled;
    qrisImageUrl;
    rawQrString;
    merchantName;
    bankEnabled;
    bankName;
    accountNumber;
    accountHolder;
    accountDetails;
    cashEnabled;
    instructions;
}
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdatePaymentConfigDto.prototype, "qrisEnabled", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentConfigDto.prototype, "qrisImageUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentConfigDto.prototype, "rawQrString", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentConfigDto.prototype, "merchantName", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdatePaymentConfigDto.prototype, "bankEnabled", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentConfigDto.prototype, "bankName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentConfigDto.prototype, "accountNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentConfigDto.prototype, "accountHolder", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentConfigDto.prototype, "accountDetails", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdatePaymentConfigDto.prototype, "cashEnabled", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdatePaymentConfigDto.prototype, "instructions", void 0);
//# sourceMappingURL=update-payment-config.dto.js.map