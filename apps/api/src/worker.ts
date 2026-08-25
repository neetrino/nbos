import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { PrismaClient } from '@nbos/database';
import { WorkerAppModule } from './worker-app.module';
import { PRISMA_TOKEN } from './database.module';
import { MAIL_QUEUE_NAME } from './modules/mail/mail-queue.constants';
import { REPORT_EXPORT_QUEUE_NAME } from './modules/reports/reports-queue.constants';
import { DRIVE_ZIP_EXPORT_QUEUE_NAME } from './modules/drive/drive-export-zip-queue.constants';
import {
  WHATSAPP_OUTBOUND_QUEUE_NAME,
  WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME,
} from './modules/integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { ATS_CALL_RECORDING_QUEUE_NAME } from './modules/integrations/ats/ats-call-recording.constants';
import { BullmqWorkerRegistry } from './runtime/bullmq-worker-registry';
import { assertProcessRoleForEntrypoint } from './runtime/process-role';
import { logProcessStartup } from './runtime/process-startup-log';
import {
  createQueueProducerConnection,
  closeRedisConnection,
  getRedisQueueUrl,
  logRedisTopology,
} from './runtime/queue-redis';
import { startWorkerHealthServer } from './runtime/worker-health.server';
import { DEFAULT_SHUTDOWN_TIMEOUT_MS, runGracefulShutdown } from './runtime/worker-shutdown';
import { checkPrismaReadiness } from './database/db-readiness';

const EXPECTED_QUEUES = [
  MAIL_QUEUE_NAME,
  REPORT_EXPORT_QUEUE_NAME,
  DRIVE_ZIP_EXPORT_QUEUE_NAME,
  WHATSAPP_PRODUCT_GROUPS_QUEUE_NAME,
  WHATSAPP_OUTBOUND_QUEUE_NAME,
  ATS_CALL_RECORDING_QUEUE_NAME,
] as const;

async function bootstrap() {
  const role = assertProcessRoleForEntrypoint('worker');
  const logger = new Logger('WorkerBootstrap');

  const redisUrl = getRedisQueueUrl();
  if (!redisUrl) {
    throw new Error('REDIS_QUEUE_URL or REDIS_URL is required for PROCESS_ROLE=worker');
  }

  logRedisTopology((message) => logger.log(message));

  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(PinoLogger));
  const registry = app.get(BullmqWorkerRegistry);
  registry.assertWorkerHasConsumers(EXPECTED_QUEUES);

  const prisma = app.get<InstanceType<typeof PrismaClient>>(PRISMA_TOKEN);

  const healthPort = Number(process.env.WORKER_HEALTH_PORT ?? process.env.PORT ?? 4001);
  const readinessRedis = createQueueProducerConnection(redisUrl);
  const healthServer = startWorkerHealthServer(healthPort, {
    registry,
    isRedisReady: async () => {
      try {
        const pong = await readinessRedis.ping();
        return pong === 'PONG';
      } catch {
        return false;
      }
    },
    isPrismaReady: async () => {
      const result = await checkPrismaReadiness(prisma);
      return result.ok;
    },
  });

  registry.markStartupComplete();
  logProcessStartup({ role, workers: registry.list() });
  logger.log(`Worker health listening on :${healthPort} (/health, /ready)`);

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    registry.beginShutdown();
    logger.log(`Received ${signal}; starting graceful shutdown`);

    const ok = await runGracefulShutdown(
      [
        {
          name: 'stop-health',
          run: () =>
            new Promise<void>((resolve, reject) => {
              healthServer.close((err) => (err ? reject(err) : resolve()));
            }),
        },
        {
          name: 'readiness-redis',
          run: async () => {
            await closeRedisConnection(readinessRedis);
          },
        },
        {
          name: 'nest-destroy-workers-redis',
          run: async () => {
            await app.close();
          },
        },
      ],
      {
        timeoutMs: Number(process.env.WORKER_SHUTDOWN_TIMEOUT_MS ?? DEFAULT_SHUTDOWN_TIMEOUT_MS),
        log: (message) => logger.log(message),
        onTimeout: () => {
          logger.error(`Active workers at timeout: ${registry.list().join(',')}`);
        },
      },
    );

    process.exitCode = ok ? 0 : 1;
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM').catch((error) => {
      logger.error(`Graceful shutdown failed: ${String(error)}`);
      process.exitCode = 1;
    });
  });
  process.once('SIGINT', () => {
    void shutdown('SIGINT').catch((error) => {
      logger.error(`Graceful shutdown failed: ${String(error)}`);
      process.exitCode = 1;
    });
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
