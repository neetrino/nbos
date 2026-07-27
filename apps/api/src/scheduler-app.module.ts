import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.validation';
import { buildLoggerParams } from './config/logger.config';
import { DatabaseModule } from './database.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { HealthController } from './health.controller';

/**
 * Dedicated scheduler process — cron + lease + internal scheduler HTTP.
 * Does not import QueueWorkersModule or the full public AppModule.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env.local',
      validate: validateEnv,
    }),
    LoggerModule.forRoot(buildLoggerParams()),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 100 }],
    }),
    DatabaseModule,
    SchedulerModule.forRoot(),
  ],
  controllers: [HealthController],
})
export class SchedulerAppModule {}
