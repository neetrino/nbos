import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { ChecklistTemplatesModule } from '../../checklist-templates/checklist-templates.module';
import { PartnerAccrualModule } from '../../finance/partner-accrual/partner-accrual.module';
import { NotificationModule } from '../../notifications/notification.module';
import { SupportModule } from '../../support/support.module';
import { PlatformAccessModule } from '../../platform-access/platform-access.module';
import { ExtensionsService } from './extensions.service';

/**
 * Controllers are registered on {@link ProjectsModule} before {@link ProjectsController}
 * so that `GET /api/projects/extensions` is not captured by `GET /api/projects/:id`.
 */
@Module({
  imports: [
    NotificationModule,
    PartnerAccrualModule,
    SupportModule,
    AuditModule,
    ChecklistTemplatesModule,
    PlatformAccessModule,
  ],
  providers: [ExtensionsService],
  exports: [ExtensionsService],
})
export class ExtensionsModule {}
