import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { Request } from 'express';
import { json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import {
  assertCorsOriginsSafeForProduction,
  parseCorsOriginsFromEnv,
} from './security/cors-origins';
import { createHelmetMiddleware } from './security/helmet.middleware';
import { SocketIoCorsAdapter } from './socket-io.adapter';
import { BullmqWorkerRegistry } from './runtime/bullmq-worker-registry';
import { assertProcessRoleForEntrypoint } from './runtime/process-role';
import { logProcessStartup } from './runtime/process-startup-log';
import { logRedisTopology } from './runtime/queue-redis';
import { MAIL_QUEUE_NAME } from './modules/mail/mail-queue.constants';
import { REPORT_EXPORT_QUEUE_NAME } from './modules/reports/reports-queue.constants';
import { DRIVE_ZIP_EXPORT_QUEUE_NAME } from './modules/drive/drive-export-zip-queue.constants';
import { WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME } from './modules/integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { ScheduledJobRegistry } from './modules/scheduler/scheduled-job-registry';
import {
  AGENT_HTTP_PATH_PREFIX,
  createAgentBodyLimitErrorHandler,
  createAgentJsonBodyParser,
} from './modules/ai-platform/limits/agent-body-limit.middleware';

/** Request body caps (defense against memory-exhaustion / DoS). Uploads go straight to R2 (presigned). */
const JSON_BODY_LIMIT = '1mb';
const URLENCODED_BODY_LIMIT = '1mb';

const QUEUE_PRODUCER_NAMES = [
  MAIL_QUEUE_NAME,
  REPORT_EXPORT_QUEUE_NAME,
  DRIVE_ZIP_EXPORT_QUEUE_NAME,
  WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME,
];

async function bootstrap() {
  const role = assertProcessRoleForEntrypoint('api');

  const corsOrigins = parseCorsOriginsFromEnv();
  assertCorsOriginsSafeForProduction(corsOrigins);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  // The agent namespace parses first with its own, smaller ceiling, so an
  // oversized machine request is refused on real bytes and answered in the `09`
  // envelope instead of reaching the employee transport cap.
  app.use(AGENT_HTTP_PATH_PREFIX, createAgentJsonBodyParser());
  app.use(
    json({
      limit: JSON_BODY_LIMIT,
      verify: (req, _res, buf) => {
        const expressReq = req as Request & { rawBody?: Buffer };
        const requestUrl = expressReq.originalUrl ?? expressReq.url ?? '';
        if (requestUrl.includes('/api/integrations/meta/webhook')) {
          expressReq.rawBody = Buffer.from(buf);
        }
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: URLENCODED_BODY_LIMIT }));
  app.use(createAgentBodyLimitErrorHandler());

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

  // Allows NestJS to close the HTTP server (release the port) before the
  // process exits on SIGTERM — prevents EADDRINUSE during hot-reload restarts.
  app.enableShutdownHooks();

  const registry = app.get(BullmqWorkerRegistry);
  const scheduledJobs = app.get(ScheduledJobRegistry);
  if (role === 'api') {
    registry.assertApiHasNoWorkers();
    scheduledJobs.assertNoScheduledJobs('api');
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  const logger = app.get(Logger);
  logRedisTopology((message) => logger.log(message));
  logProcessStartup({
    role,
    workers: registry.list(),
    queueProducers: QUEUE_PRODUCER_NAMES,
    scheduledJobs: scheduledJobs.list(),
  });
  logger.log(`NBOS API running on http://localhost:${port}`);
  if (swaggerEnabled) {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
