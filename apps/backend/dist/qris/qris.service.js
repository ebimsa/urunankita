var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BadRequestException, Injectable } from '@nestjs/common';
import QRCode from 'qrcode';
import { calculateCRC16 } from './crc16.js';
let QrisService = class QrisService {
    parseTLV(qrisString) {
        const elements = [];
        let i = 0;
        while (i < qrisString.length) {
            if (i + 4 > qrisString.length)
                break;
            const tag = qrisString.substring(i, i + 2);
            const lengthStr = qrisString.substring(i + 2, i + 4);
            const length = parseInt(lengthStr, 10);
            if (isNaN(length) || i + 4 + length > qrisString.length) {
                break;
            }
            const value = qrisString.substring(i + 4, i + 4 + length);
            elements.push({ tag, length, value });
            i += 4 + length;
        }
        return elements;
    }
    buildTLVString(elements) {
        return elements
            .map((el) => {
            const len = el.value.length.toString().padStart(2, '0');
            return `${el.tag}${len}${el.value}`;
        })
            .join('');
    }
    validateQris(qrisString) {
        if (!qrisString || qrisString.length < 20 || !qrisString.startsWith('000201')) {
            return false;
        }
        const crcTagIndex = qrisString.lastIndexOf('6304');
        if (crcTagIndex === -1 || crcTagIndex + 8 !== qrisString.length) {
            return false;
        }
        const dataToCrc = qrisString.substring(0, crcTagIndex + 4);
        const expectedCrc = qrisString.substring(crcTagIndex + 4);
        const actualCrc = calculateCRC16(dataToCrc);
        return expectedCrc.toUpperCase() === actualCrc.toUpperCase();
    }
    parseQris(qrisString) {
        const elements = this.parseTLV(qrisString);
        const getTag = (t) => elements.find((el) => el.tag === t)?.value;
        const version = getTag('00') ?? '01';
        const method = getTag('01') ?? '11';
        const merchantName = getTag('59');
        const merchantCity = getTag('60');
        const postalCode = getTag('61');
        const currencyCode = getTag('53');
        const amountStr = getTag('54');
        const crc = getTag('63') ?? '';
        const crcTagIndex = qrisString.lastIndexOf('6304');
        const dataToCrc = crcTagIndex !== -1 ? qrisString.substring(0, crcTagIndex + 4) : '';
        const isValidCrc = crcTagIndex !== -1 && calculateCRC16(dataToCrc).toUpperCase() === crc.toUpperCase();
        return {
            version,
            isDynamic: method === '12',
            merchantName,
            merchantCity,
            postalCode,
            currencyCode: currencyCode === '360' ? 'IDR' : currencyCode,
            amount: amountStr ? parseFloat(amountStr) : undefined,
            crc,
            isValidCrc,
        };
    }
    convertToDynamic(staticQris, amount) {
        const cleanQris = staticQris.trim();
        if (!cleanQris.startsWith('000201')) {
            throw new BadRequestException('Format QRIS tidak valid: Harus berstandar EMVCo (dimulai dengan 000201)');
        }
        if (amount <= 0) {
            throw new BadRequestException('Nominal pembayaran harus lebih besar dari 0');
        }
        const elements = this.parseTLV(cleanQris);
        const methodIndex = elements.findIndex((el) => el.tag === '01');
        if (methodIndex !== -1) {
            elements[methodIndex].value = '12';
            elements[methodIndex].length = 2;
        }
        else {
            elements.splice(1, 0, { tag: '01', length: 2, value: '12' });
        }
        const formattedAmount = Math.round(amount).toString();
        const amountElem = {
            tag: '54',
            length: formattedAmount.length,
            value: formattedAmount,
        };
        const existingAmountIndex = elements.findIndex((el) => el.tag === '54');
        if (existingAmountIndex !== -1) {
            elements[existingAmountIndex] = amountElem;
        }
        else {
            const currencyIndex = elements.findIndex((el) => el.tag === '53');
            if (currencyIndex !== -1) {
                elements.splice(currencyIndex + 1, 0, amountElem);
            }
            else {
                const countryIndex = elements.findIndex((el) => el.tag === '58');
                if (countryIndex !== -1) {
                    elements.splice(countryIndex, 0, amountElem);
                }
                else {
                    elements.push(amountElem);
                }
            }
        }
        const elementsWithoutCrc = elements.filter((el) => el.tag !== '63');
        const rawString = this.buildTLVString(elementsWithoutCrc) + '6304';
        const newCrc = calculateCRC16(rawString);
        return rawString + newCrc;
    }
    async generateQrDataUrl(qrisString) {
        return QRCode.toDataURL(qrisString, {
            errorCorrectionLevel: 'M',
            margin: 2,
            scale: 8,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });
    }
};
QrisService = __decorate([
    Injectable()
], QrisService);
export { QrisService };
//# sourceMappingURL=qris.service.js.map