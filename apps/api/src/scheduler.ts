import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SchedulerAppModule } from './scheduler-app.module';
import { assertProcessRoleForEntrypoint } from './runtime/process-role';
import { logProcessStartup } from './runtime/process-startup-log';

/**
 * Phase 4 scaffold. Prefer external cron → nbos-api /api/scheduler/* until scheduler lease lands.
 */
async function bootstrap() {
  const role = assertProcessRoleForEntrypoint('scheduler');
  const app = await NestFactory.create<NestExpressApplication>(SchedulerAppModule, {
    bufferLogs: true,
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  const port = process.env.PORT ?? 4002;
  await app.listen(port);
  logProcessStartup({ role, workers: [] });
  new Logger('SchedulerBootstrap').log(`Scheduler scaffold on :${port}`);
}

bootstrap().catch((error) => {
   
  console.error(error);
  process.exit(1);
});
