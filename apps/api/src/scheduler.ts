import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SchedulerAppModule } from './scheduler-app.module';
import { ScheduledJobRegistry } from './modules/scheduler/scheduled-job-registry';
import {
  assertSchedulerLeaseTiming,
  isSchedulerEnabled,
  DEFAULT_SCHEDULER_SHUTDOWN_TIMEOUT_MS,
  SCHEDULER_HEALTH_PORT_ENV,
  SCHEDULER_SHUTDOWN_TIMEOUT_MS_ENV,
} from './modules/scheduler/scheduler-lease.constants';
import { assertProcessRoleForEntrypoint } from './runtime/process-role';
import { logProcessStartup } from './runtime/process-startup-log';
import { logRedisTopology } from './runtime/queue-redis';
import { runGracefulShutdown } from './runtime/worker-shutdown';

async function bootstrap() {
  const role = assertProcessRoleForEntrypoint('scheduler');
  const logger = new Logger('SchedulerBootstrap');
  assertSchedulerLeaseTiming();
  logRedisTopology((message) => logger.log(message));

  const app = await NestFactory.create<NestExpressApplication>(SchedulerAppModule, {
    bufferLogs: true,
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');

  const registry = app.get(ScheduledJobRegistry);
  registry.assertHasScheduledJobsWhenEnabled(isSchedulerEnabled());

  const healthPort = Number(process.env[SCHEDULER_HEALTH_PORT_ENV] ?? process.env.PORT ?? 4002);

  await app.listen(healthPort);
  registry.markStartupComplete();
  logProcessStartup({ role, workers: [], scheduledJobs: registry.list() });
  logger.log(
    `Scheduler listening on :${healthPort} (GET /api/health, /api/ready, /api/scheduler/*)`,
  );

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    registry.beginShutdown();
    logger.log(`Received ${signal}; graceful scheduler shutdown`);
    const ok = await runGracefulShutdown(
      [
        {
          name: 'nest-close',
          run: async () => {
            await app.close();
          },
        },
      ],
      {
        timeoutMs: Number(
          process.env[SCHEDULER_SHUTDOWN_TIMEOUT_MS_ENV] ?? DEFAULT_SCHEDULER_SHUTDOWN_TIMEOUT_MS,
        ),
        log: (message) => logger.log(message),
      },
    );
    process.exitCode = ok ? 0 : 1;
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
