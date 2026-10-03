import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: process.env.DATABASE_URL
        ? { db: { url: process.env.DATABASE_URL } }
        : undefined,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err: any) {
      console.error('⚠️ Gagal terhubung ke database saat startup:', err?.message || err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
