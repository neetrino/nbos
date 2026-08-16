import { Module } from '@nestjs/common';
import { ClientServicesModule } from '../../client-services/client-services.module';
import { BonusModule } from '../../bonus/bonus.module';
import { NotificationModule } from '../../notifications/notification.module';
import { OperationalJournalModule } from '../journal/operational-journal.module';
import { PartnerAccrualModule } from '../partner-accrual/partner-accrual.module';
import { PAYMENTS_SERVICE_TOKEN } from '../invoices/invoice-mark-paid-settle';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    ClientServicesModule,
    BonusModule,
    NotificationModule,
    OperationalJournalModule,
    PartnerAccrualModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, { provide: PAYMENTS_SERVICE_TOKEN, useExisting: PaymentsService }],
  exports: [PaymentsService, PAYMENTS_SERVICE_TOKEN],
})
export class PaymentsModule {}
