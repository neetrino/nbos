import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadConversionService } from './lead-conversion.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadConversionService],
  exports: [LeadsService],
})
export class LeadsModule {}
