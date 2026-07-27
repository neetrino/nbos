import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.validation';
import { buildLoggerParams } from './config/logger.config';
import { DatabaseModule } from './database.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { MailModule } from './modules/mail/mail.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DriveModule } from './modules/drive/drive.module';
import { WhatsAppGatewayModule } from './modules/integrations/whatsapp-gateway/whatsapp-gateway.module';
import { PlatformAccessModule } from './modules/platform-access/platform-access.module';
import { QueueWorkersModule } from './runtime/queue-workers.module';

/**
 * BullMQ worker process graph — no public REST/Socket/SSE bootstrap.
 * Controllers declared on imported feature modules are not bound without Nest HTTP listen.
 * Coolify health uses the dedicated worker health HTTP server in worker.ts.
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
    AuditModule,
    NotificationModule,
    PlatformAccessModule,
    MailModule,
    ReportsModule,
    DriveModule,
    WhatsAppGatewayModule,
    QueueWorkersModule.forWorker(),
  ],
})
export class WorkerAppModule {}
