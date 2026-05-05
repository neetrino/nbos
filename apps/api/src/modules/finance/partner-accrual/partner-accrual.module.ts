import { Module } from '@nestjs/common';
import { OperationalJournalModule } from '../journal/operational-journal.module';
import { PartnerAccrualClassicService } from './partner-accrual-classic.service';

@Module({
  imports: [OperationalJournalModule],
  providers: [PartnerAccrualClassicService],
  exports: [PartnerAccrualClassicService],
})
export class PartnerAccrualModule {}
