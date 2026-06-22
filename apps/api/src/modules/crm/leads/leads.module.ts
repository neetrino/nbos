import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadConversionService } from './lead-conversion.service';

@Module({
  imports: [AuditModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadConversionService],
  exports: [LeadsService],
})
export class LeadsModule {}
