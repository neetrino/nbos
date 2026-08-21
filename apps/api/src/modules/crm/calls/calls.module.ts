import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { DriveModule } from '../../drive/drive.module';
import { AtsModule } from '../../integrations/ats/ats.module';
import { CallsController } from './calls.controller';
import { CallsRecordingService } from './calls-recording.service';
import { CallsService } from './calls.service';
import { ClickToCallService } from './click-to-call.service';
import { ClickToCallTargetLoader } from './click-to-call-target';

@Module({
  imports: [AuditModule, AtsModule, DriveModule],
  controllers: [CallsController],
  providers: [CallsService, CallsRecordingService, ClickToCallService, ClickToCallTargetLoader],
  exports: [CallsService],
})
export class CallsModule {}
