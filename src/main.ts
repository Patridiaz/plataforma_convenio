import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
  origin: ['http://localhost:4200', 'https://miconvenio.eduhuechuraba.cl']
  });

  // Servir archivos estáticos de la carpeta 'uploads/evidencias'
  app.use('/uploads/evidencias', express.static(join(__dirname, '..', 'uploads/evidencias')));

  await app.listen(3000);
}
bootstrap();
