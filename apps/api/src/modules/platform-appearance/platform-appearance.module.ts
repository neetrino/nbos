import { Module } from '@nestjs/common';
import { DriveModule } from '../drive/drive.module';
import { PlatformAppearanceController } from './platform-appearance.controller';
import { PlatformAppearanceService } from './platform-appearance.service';
import { PlatformAppearanceStorageService } from './platform-appearance-storage.service';

@Module({
  imports: [DriveModule],
  controllers: [PlatformAppearanceController],
  providers: [PlatformAppearanceService, PlatformAppearanceStorageService],
  exports: [PlatformAppearanceService],
})
export class PlatformAppearanceModule {}
