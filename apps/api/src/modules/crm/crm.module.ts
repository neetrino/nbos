import { Module } from '@nestjs/common';
import { CallsModule } from './calls/calls.module';
import { LeadsModule } from './leads/leads.module';
import { DealsModule } from './deals/deals.module';

@Module({
  imports: [LeadsModule, DealsModule, CallsModule],
})
export class CrmModule {}
