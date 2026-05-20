import { Module } from '@nestjs/common';
import { ClientServicesModule } from '../../client-services/client-services.module';
import { BonusModule } from '../../bonus/bonus.module';
import { NotificationModule } from '../../notifications/notification.module';
import { OperationalJournalModule } from '../journal/operational-journal.module';
import { PartnerAccrualModule } from '../partner-accrual/partner-accrual.module';
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
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
