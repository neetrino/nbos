import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { DriveService } from './drive.service';
import { DriveR2Client } from './drive-r2.client';
import { DriveUploadSessionService } from './drive-upload-session.service';
import { DriveFolderService } from './drive-folder.service';
import { DriveZipExportService } from './drive-zip-export.service';
import { DriveExportZipQueueService } from './drive-export-zip-queue.service';
import { DriveExportZipWorker } from './drive-export-zip.worker';
import { DriveProjectHubService } from './drive-project-hub.service';
import { DriveDealWonLinksService } from './drive-deal-won-links.service';
import { NotificationModule } from '../notifications/notification.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [NotificationModule, AuditModule],
  controllers: [DriveController],
  providers: [
    DriveR2Client,
    DriveService,
    DriveUploadSessionService,
    DriveFolderService,
    DriveZipExportService,
    DriveExportZipQueueService,
    DriveExportZipWorker,
    DriveProjectHubService,
    DriveDealWonLinksService,
  ],
  exports: [DriveService, DriveUploadSessionService, DriveDealWonLinksService],
})
export class DriveModule {}
