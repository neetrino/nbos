import { Module } from '@nestjs/common';
import { OperationalJournalModule } from '../journal/operational-journal.module';
import { PartnerAccrualClassicService } from './partner-accrual-classic.service';
import { PartnerAccrualSubscriptionService } from './partner-accrual-subscription.service';

@Module({
  imports: [OperationalJournalModule],
  providers: [PartnerAccrualClassicService, PartnerAccrualSubscriptionService],
  exports: [PartnerAccrualClassicService, PartnerAccrualSubscriptionService],
})
export class PartnerAccrualModule {}
