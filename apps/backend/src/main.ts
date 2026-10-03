import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import { AppModule } from './app.module.js';

const server: Express = express();

server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));

let isReady = false;
let initPromise: Promise<any> | null = null;

async function bootstrap() {
  // 1. Validasi variabel environment esensial saat startup
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Variabel environment belum lengkap: ${missing.join(', ')}`);
    console.error(`   Silakan salin apps/backend/.env.example ke apps/backend/.env dan sesuaikan nilainya.`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }

  // 2. Inisialisasi NestJS dengan custom body parser limit & ExpressAdapter
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bodyParser: false,
  });

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.init();
  isReady = true;

  // Jalankan listener port jika bukan di environment Vercel
  if (!process.env.VERCEL) {
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`🚀 urunankita Backend berjalan di http://localhost:${port}`);
  }

  return app;
}

// Middleware untuk menormalisasi rute (baik Vercel meneruskan /api/xxx maupun /xxx)
server.use((req, res, next) => {
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  next();
});

// Handler untuk Vercel Serverless Function
export default async function handler(req: any, res: any) {
  if (!isReady) {
    if (!initPromise) {
      initPromise = bootstrap();
    }
    await initPromise;
  }

  // Kembalikan Promise yang menunggu sampai Express selesai mengirimkan respon ke klien
  return new Promise<void>((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('close', () => resolve());
    res.on('error', (err: any) => reject(err));
    server(req, res);
  });
}

export { server, bootstrap };

// Jika berjalan dengan PORT (Vercel Services mode server atau lokal)
const port = process.env.PORT || (!process.env.VERCEL ? 3001 : null);
if (port) {
  const app = await bootstrap();
  await app.listen(port);
  console.log(`🚀 urunankita Backend berjalan di port ${port}`);
}


