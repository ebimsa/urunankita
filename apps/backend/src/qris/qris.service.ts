import { BadRequestException, Injectable } from '@nestjs/common';
import QRCode from 'qrcode';
import { calculateCRC16 } from './crc16.js';

export interface TLV {
  tag: string;
  length: number;
  value: string;
}

export interface ParsedQris {
  version: string;
  isDynamic: boolean;
  merchantName?: string;
  merchantCity?: string;
  postalCode?: string;
  currencyCode?: string;
  amount?: number;
  crc: string;
  isValidCrc: boolean;
}

@Injectable()
export class QrisService {
  /**
   * Parse flat TLV string ke array of TLV elements
   */
  parseTLV(qrisString: string): TLV[] {
    const elements: TLV[] = [];
    let i = 0;

    while (i < qrisString.length) {
      if (i + 4 > qrisString.length) break;

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

  /**
   * Rebuild string dari array of TLV elements
   */
  buildTLVString(elements: TLV[]): string {
    return elements
      .map((el) => {
        const len = el.value.length.toString().padStart(2, '0');
        return `${el.tag}${len}${el.value}`;
      })
      .join('');
  }

  /**
   * Validasi struktur dan checksum CRC16 QRIS
   */
  validateQris(qrisString: string): boolean {
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

  /**
   * Parsing data merchant dan status dari QRIS string
   */
  parseQris(qrisString: string): ParsedQris {
    const elements = this.parseTLV(qrisString);
    const getTag = (t: string) => elements.find((el) => el.tag === t)?.value;

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

  /**
   * Mengonversi QRIS Statis menjadi QRIS Dinamis dengan menyisipkan nominal tagihan
   */
  convertToDynamic(staticQris: string, amount: number): string {
    const cleanQris = staticQris.trim();

    if (!cleanQris.startsWith('000201')) {
      throw new BadRequestException('Format QRIS tidak valid: Harus berstandar EMVCo (dimulai dengan 000201)');
    }

    if (amount <= 0) {
      throw new BadRequestException('Nominal pembayaran harus lebih besar dari 0');
    }

    // 1. Parse TLVs
    const elements = this.parseTLV(cleanQris);

    // 2. Ubah Point of Initiation Method (Tag 01) dari '11' (statis) ke '12' (dinamis)
    const methodIndex = elements.findIndex((el) => el.tag === '01');
    if (methodIndex !== -1) {
      elements[methodIndex].value = '12';
      elements[methodIndex].length = 2;
    } else {
      elements.splice(1, 0, { tag: '01', length: 2, value: '12' });
    }

    // 3. Sisipkan atau perbarui Transaction Amount (Tag 54)
    // Tag 54 harus diletakkan setelah Currency Code (Tag 53) atau sebelum Country Code (Tag 58)
    const formattedAmount = Math.round(amount).toString();
    const amountElem: TLV = {
      tag: '54',
      length: formattedAmount.length,
      value: formattedAmount,
    };

    const existingAmountIndex = elements.findIndex((el) => el.tag === '54');
    if (existingAmountIndex !== -1) {
      elements[existingAmountIndex] = amountElem;
    } else {
      // Cari posisi tepat: setelah 53 jika ada, atau sebelum 58
      const currencyIndex = elements.findIndex((el) => el.tag === '53');
      if (currencyIndex !== -1) {
        elements.splice(currencyIndex + 1, 0, amountElem);
      } else {
        const countryIndex = elements.findIndex((el) => el.tag === '58');
        if (countryIndex !== -1) {
          elements.splice(countryIndex, 0, amountElem);
        } else {
          elements.push(amountElem);
        }
      }
    }

    // 4. Hapus Tag 63 (CRC lama)
    const elementsWithoutCrc = elements.filter((el) => el.tag !== '63');

    // 5. Rebuild string dan tambahkan header Tag 63 ('6304')
    const rawString = this.buildTLVString(elementsWithoutCrc) + '6304';

    // 6. Hitung CRC16 baru
    const newCrc = calculateCRC16(rawString);

    return rawString + newCrc;
  }

  /**
   * Menghasilkan Data URL (Base64 PNG) dari QRIS string untuk ditampilkan di antarmuka
   */
  async generateQrDataUrl(qrisString: string): Promise<string> {
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
}
