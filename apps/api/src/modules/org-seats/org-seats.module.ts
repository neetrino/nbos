import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PlatformOwnershipModule } from '../platform-ownership/platform-ownership.module';
import { EmployeeEffectiveAccessController } from './employee-effective-access.controller';
import { EmployeeEffectiveAccessService } from './employee-effective-access.service';
import { OrgSeatAssignmentsService } from './org-seat-assignments.service';
import { OrgSeatsController } from './org-seats.controller';
import { OrgSeatsService } from './org-seats.service';
import { OrgSeatAccessPreviewService } from './org-seat-access-preview.service';

@Module({
  imports: [AuditModule, PlatformOwnershipModule],
  controllers: [OrgSeatsController, EmployeeEffectiveAccessController],
  providers: [
    OrgSeatsService,
    OrgSeatAssignmentsService,
    EmployeeEffectiveAccessService,
    OrgSeatAccessPreviewService,
  ],
  exports: [OrgSeatsService, OrgSeatAssignmentsService],
})
export class OrgSeatsModule {}
