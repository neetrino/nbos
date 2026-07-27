import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.validation';
import { buildLoggerParams } from './config/logger.config';
import { DatabaseModule } from './database.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { HealthController } from './health.controller';

/**
 * Scaffold for Phase 4 dedicated scheduler process.
 * Today production still prefers external cron → API scheduler routes.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env.local',
      validate: validateEnv,
    }),
    LoggerModule.forRoot(buildLoggerParams()),
    DatabaseModule,
    SchedulerModule,
  ],
  controllers: [HealthController],
})
export class SchedulerAppModule {}
