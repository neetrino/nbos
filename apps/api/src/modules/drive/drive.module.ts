import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { DriveService } from './drive.service';
import { DriveR2Client } from './drive-r2.client';
import { DriveUploadSessionService } from './drive-upload-session.service';
import { DriveFolderService } from './drive-folder.service';
import { DriveFolderGrantService } from './drive-folder-grant.service';
import { DriveZipExportService } from './drive-zip-export.service';
import { DriveExportZipQueueService } from './drive-export-zip-queue.service';
import { DriveExportZipWorker } from './drive-export-zip.worker';
import { DriveProjectHubService } from './drive-project-hub.service';
import { DriveDealWonLinksService } from './drive-deal-won-links.service';
import { DriveTypedExportResolver } from './drive-typed-export-resolver';
import { DriveCleanupCandidatesService } from './drive-cleanup-candidates.service';
import { DriveCleanupApplyService } from './drive-cleanup-apply.service';
import { NotificationModule } from '../notifications/notification.module';
import { AuditModule } from '../audit/audit.module';
import { PlatformAccessModule } from '../platform-access/platform-access.module';
import { DriveAccessContextService } from './drive-access-context.service';
import { DriveLibraryEntitiesService } from './drive-library-entities.service';

@Module({
  imports: [NotificationModule, AuditModule, PlatformAccessModule],
  controllers: [DriveController],
  providers: [
    DriveR2Client,
    DriveService,
    DriveUploadSessionService,
    DriveFolderService,
    DriveFolderGrantService,
    DriveZipExportService,
    DriveExportZipQueueService,
    DriveExportZipWorker,
    DriveProjectHubService,
    DriveDealWonLinksService,
    DriveTypedExportResolver,
    DriveCleanupCandidatesService,
    DriveCleanupApplyService,
    DriveAccessContextService,
    DriveLibraryEntitiesService,
  ],
  exports: [DriveService, DriveUploadSessionService, DriveDealWonLinksService, DriveR2Client],
})
export class DriveModule {}
