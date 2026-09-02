import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { getCorsOrigins, validateEnvironment } from './config/environment';

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'production') {
    const express = app.getHttpAdapter().getInstance();
    express.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
  }

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
