import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // 1. Validasi variabel environment esensial saat startup
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Variabel environment belum lengkap: ${missing.join(', ')}`);
    console.error(`   Silakan salin apps/backend/.env.example ke apps/backend/.env dan sesuaikan nilainya.`);
    process.exit(1);
  }

  // 2. Inisialisasi NestJS dengan custom body parser limit (10MB untuk upload bukti bayar Base64)
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 urunankita Backend berjalan di http://localhost:${port}`);
}
await bootstrap();

