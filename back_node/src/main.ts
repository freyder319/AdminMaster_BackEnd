import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
// Swagger removed per request

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Body size limits for base64 images
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  // Serve actual storage directory at /storage
  app.use('/storage', express.static(join(__dirname, '..', 'storage')));
  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  // Restricted CORS (ajusta origins según tus entornos permitidos)
  app.enableCors({
    origin: [
      'http://localhost:4200',
    ],
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: true,
  });
  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
