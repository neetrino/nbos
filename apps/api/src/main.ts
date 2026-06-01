import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import {
  assertCorsOriginsSafeForProduction,
  parseCorsOriginsFromEnv,
} from './security/cors-origins';
import { createHelmetMiddleware } from './security/helmet.middleware';
import { SocketIoCorsAdapter } from './socket-io.adapter';

/** Request body caps (defense against memory-exhaustion / DoS). Uploads go straight to R2 (presigned). */
const JSON_BODY_LIMIT = '1mb';
const URLENCODED_BODY_LIMIT = '1mb';

async function bootstrap() {
  const corsOrigins = parseCorsOriginsFromEnv();
  assertCorsOriginsSafeForProduction(corsOrigins);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.use(json({ limit: JSON_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: URLENCODED_BODY_LIMIT }));

  app.useWebSocketAdapter(new SocketIoCorsAdapter(app));

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(createHelmetMiddleware());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const swaggerEnabled = process.env.NODE_ENV !== 'production';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('NBOS API')
      .setDescription('NBOS Platform — Business Operation System API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.warn(`NBOS API running on http://localhost:${port}`);
  if (swaggerEnabled) {
    console.warn(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
