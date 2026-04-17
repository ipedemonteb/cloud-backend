import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cloud Backend API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
