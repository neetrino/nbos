import { DynamicModule, Module } from '@nestjs/common';
import { AuditModule } from '../modules/audit/audit.module';
import { MailModule } from '../modules/mail/mail.module';
import { MailWorker } from '../modules/mail/mail.worker';
import { ReportsModule } from '../modules/reports/reports.module';
import { ReportsExportWorker } from '../modules/reports/reports-export.worker';
import { DriveModule } from '../modules/drive/drive.module';
import { DriveExportZipWorker } from '../modules/drive/drive-export-zip.worker';
import { WhatsAppGatewayModule } from '../modules/integrations/whatsapp-gateway/whatsapp-gateway.module';
import { AtsModule } from '../modules/integrations/ats/ats.module';
import { AtsCallRecordingWorker } from '../modules/integrations/ats/ats-call-recording.worker';
import { WhatsAppProductGroupsWorker } from '../modules/integrations/whatsapp-gateway/whatsapp-product-groups.worker';
import { OpsAlertsModule } from '../modules/ops-alerts/ops-alerts.module';
import { BullmqWorkerRegistry } from './bullmq-worker-registry';
import { shouldRegisterBullmqWorkers } from './process-role';

/**
 * BullMQ consumers only. Importing queue producer modules must NOT construct Workers.
 * Workers are registered here — and only when PROCESS_ROLE is worker|all (or forWorker()).
 */
@Module({})
export class QueueWorkersModule {
  static register(): DynamicModule {
    if (!shouldRegisterBullmqWorkers()) {
      return {
        module: QueueWorkersModule,
        providers: [BullmqWorkerRegistry],
        exports: [BullmqWorkerRegistry],
      };
    }
    return QueueWorkersModule.forWorker();
  }

  /** Dedicated worker process — always register consumers. */
  static forWorker(): DynamicModule {
    return {
      module: QueueWorkersModule,
      imports: [
        AuditModule,
        MailModule,
        ReportsModule,
        DriveModule,
        WhatsAppGatewayModule,
        AtsModule,
        OpsAlertsModule,
      ],
      providers: [
        BullmqWorkerRegistry,
        MailWorker,
        ReportsExportWorker,
        DriveExportZipWorker,
        WhatsAppProductGroupsWorker,
        AtsCallRecordingWorker,
      ],
      exports: [BullmqWorkerRegistry],
    };
  }
}
