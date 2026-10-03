import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    getHealth(): Promise<{
        status: string;
        service: string;
        timestamp: string;
        env: {
            hasDbUrl: boolean;
            hasJwtSecret: boolean;
            nodeEnv: string | undefined;
        };
        database: {
            status: string;
            error: string | null;
        };
    }>;
}
