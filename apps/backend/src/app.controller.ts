import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const hasDbUrl = Boolean(process.env.DATABASE_URL);
    const hasJwtSecret = Boolean(process.env.JWT_SECRET);
    let dbStatus = 'disconnected';
    let dbError: string | null = null;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (err: any) {
      dbError = err?.message || String(err);
    }

    return {
      status: 'ok',
      service: 'urunankita-backend',
      timestamp: new Date().toISOString(),
      env: {
        hasDbUrl,
        hasJwtSecret,
        nodeEnv: process.env.NODE_ENV,
      },
      database: {
        status: dbStatus,
        error: dbError,
      },
    };
  }
}
