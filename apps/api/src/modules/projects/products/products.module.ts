import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { ChecklistTemplatesModule } from '../../checklist-templates/checklist-templates.module';
import { PartnerAccrualModule } from '../../finance/partner-accrual/partner-accrual.module';
import { NotificationModule } from '../../notifications/notification.module';
import { ProductsService } from './products.service';
import { ProductAccessSlotBindingsService } from './product-access-slot-bindings.service';

/**
 * Controllers are registered on {@link ProjectsModule} before {@link ProjectsController}
 * so that `GET /api/projects/products` is not captured by `GET /api/projects/:id`.
 */
@Module({
  imports: [NotificationModule, PartnerAccrualModule, AuditModule, ChecklistTemplatesModule],
  providers: [ProductsService, ProductAccessSlotBindingsService],
  exports: [ProductsService, ProductAccessSlotBindingsService],
})
export class ProductsModule {}
