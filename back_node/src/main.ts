import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Body size limits for base64 images
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  // Serve actual storage directory at /storage
  app.use('/storage', express.static(join(__dirname, '..', 'storage')));
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
