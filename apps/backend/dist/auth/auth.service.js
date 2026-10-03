var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, ConflictException, Injectable, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        if (!dto.email && !dto.phone) {
            throw new BadRequestException('Harap cantumkan email atau nomor telepon');
        }
        if (dto.email) {
            const existingEmail = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existingEmail) {
                throw new ConflictException('Email ini sudah terdaftar');
            }
        }
        if (dto.phone) {
            const existingPhone = await this.prisma.user.findUnique({
                where: { phone: dto.phone },
            });
            if (existingPhone) {
                throw new ConflictException('Nomor telepon ini sudah terdaftar');
            }
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(dto.password, saltRounds);
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                email: dto.email || null,
                phone: dto.phone || null,
                passwordHash,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                createdAt: true,
            },
        });
        const payload = {
            sub: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            message: 'Pendaftaran akun berhasil',
            accessToken,
            user,
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.identifier },
                    { phone: dto.identifier },
                ],
            },
        });
        if (!user) {
            throw new UnauthorizedException('Email/Nomor HP atau kata sandi tidak valid');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email/Nomor HP atau kata sandi tidak valid');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            message: 'Login berhasil',
            accessToken,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                avatarUrl: user.avatarUrl,
                role: user.role,
                createdAt: user.createdAt,
            },
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                createdAt: true,
                memberships: {
                    select: {
                        role: true,
                        groupId: true,
                        group: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                joinCode: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new UnauthorizedException('Pengguna tidak ditemukan');
        }
        return user;
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map