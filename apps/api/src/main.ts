import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger / OpenAPI docs
  const config = new DocumentBuilder()
    .setTitle('MockGame API')
    .setDescription('Competitive exam preparation platform — ranked 1v1 battles API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('Auth', 'Registration, login, token management')
    .addTag('Profile', 'User profile management')
    .addTag('Matchmaking', 'Queue and match creation')
    .addTag('Battles', 'Battle lifecycle')
    .addTag('Matches', 'Match history')
    .addTag('Leaderboard', 'Rankings')
    .addTag('Questions', 'Question bank CRUD')
    .addTag('Admin', 'Admin and moderation APIs')
    .addTag('Health', 'System health')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
  console.log(`📖 Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
