var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';
export class CreateUnitsBulkDto {
    names;
}
__decorate([
    IsArray({ message: 'Daftar nama unit harus berupa array' }),
    ArrayMinSize(1, { message: 'Minimal harus ada 1 nama unit' }),
    IsString({ each: true, message: 'Setiap nama unit harus berupa teks' }),
    IsNotEmpty({ each: true, message: 'Nama unit tidak boleh kosong' }),
    __metadata("design:type", Array)
], CreateUnitsBulkDto.prototype, "names", void 0);
//# sourceMappingURL=create-units-bulk.dto.js.map