import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // 👈 IMPORTANTE

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe()); // 👈 ESTA LÍNEA

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
