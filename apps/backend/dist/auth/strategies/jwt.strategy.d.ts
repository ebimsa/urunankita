import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
export interface JwtPayload {
    sub: string;
    email?: string;
    phone?: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService, configService: ConfigService);
    validate(payload: JwtPayload): Promise<{
        fullName: string;
        email: string | null;
        phone: string | null;
        id: string;
        avatarUrl: string | null;
        role: import("@prisma/client").$Enums.GlobalRole;
        createdAt: Date;
    }>;
}
export {};
