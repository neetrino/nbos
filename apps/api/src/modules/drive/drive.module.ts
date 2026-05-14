import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { DriveService } from './drive.service';
import { DriveR2Client } from './drive-r2.client';
import { DriveUploadSessionService } from './drive-upload-session.service';
import { DriveFolderService } from './drive-folder.service';

@Module({
  controllers: [DriveController],
  providers: [DriveR2Client, DriveService, DriveUploadSessionService, DriveFolderService],
  exports: [DriveService, DriveUploadSessionService],
})
export class DriveModule {}
