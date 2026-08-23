import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { DriveModule } from '../../drive/drive.module';
import { AtsModule } from '../../integrations/ats/ats.module';
import { CallAccessPolicyService } from './call-access-policy.service';
import { CallsController } from './calls.controller';
import { CallsRecordingService } from './calls-recording.service';
import { CallsService } from './calls.service';
import { ClickToCallAccessPolicyService } from './click-to-call-access-policy.service';
import { ClickToCallService } from './click-to-call.service';
import { ClickToCallTargetLoader } from './click-to-call-target';
import { ActiveCallScreenService } from './active-call-screen.service';
import { CallNoteService } from './call-note.service';

@Module({
  imports: [AuditModule, AtsModule, DriveModule],
  controllers: [CallsController],
  providers: [
    CallAccessPolicyService,
    CallsService,
    CallsRecordingService,
    ClickToCallAccessPolicyService,
    ClickToCallService,
    ClickToCallTargetLoader,
    ActiveCallScreenService,
    CallNoteService,
  ],
  exports: [CallsService],
})
export class CallsModule {}
