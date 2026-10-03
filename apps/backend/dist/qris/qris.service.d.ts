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
export declare class QrisService {
    parseTLV(qrisString: string): TLV[];
    buildTLVString(elements: TLV[]): string;
    validateQris(qrisString: string): boolean;
    parseQris(qrisString: string): ParsedQris;
    convertToDynamic(staticQris: string, amount: number): string;
    generateQrDataUrl(qrisString: string): Promise<string>;
}
