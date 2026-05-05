import { Module } from '@nestjs/common';
import { OperationalJournalController } from './operational-journal.controller';
import { OperationalJournalService } from './operational-journal.service';

@Module({
  controllers: [OperationalJournalController],
  providers: [OperationalJournalService],
  exports: [OperationalJournalService],
})
export class OperationalJournalModule {}
