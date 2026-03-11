import { Module } from '@nestjs/common';
import { LeadsModule } from './leads/leads.module';
import { DealsModule } from './deals/deals.module';

@Module({
  imports: [LeadsModule, DealsModule],
})
export class CrmModule {}
