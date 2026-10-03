import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module.js';
const server = express();
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));
let isReady = false;
let initPromise = null;
async function bootstrap() {
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = requiredEnvVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(`❌ Variabel environment belum lengkap: ${missing.join(', ')}`);
        console.error(`   Silakan salin apps/backend/.env.example ke apps/backend/.env dan sesuaikan nilainya.`);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
        bodyParser: false,
    });
    app.enableCors();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    await app.init();
    isReady = true;
    if (!process.env.VERCEL) {
        const port = process.env.PORT ?? 3001;
        await app.listen(port);
        console.log(`🚀 urunankita Backend berjalan di http://localhost:${port}`);
    }
    return app;
}
server.use((req, res, next) => {
    if (!req.url.startsWith('/api')) {
        req.url = '/api' + (req.url === '/' ? '' : req.url);
    }
    next();
});
export default async function handler(req, res) {
    if (!isReady) {
        if (!initPromise) {
            initPromise = bootstrap().then(() => { });
        }
        await initPromise;
    }
    return new Promise((resolve, reject) => {
        res.on('finish', () => resolve());
        res.on('close', () => resolve());
        res.on('error', (err) => reject(err));
        server(req, res);
    });
}
if (!process.env.VERCEL) {
    await bootstrap();
}
//# sourceMappingURL=main.js.map