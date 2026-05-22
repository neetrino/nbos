import { Module } from '@nestjs/common';

import { KpiPoliciesController } from './kpi-policies.controller';
import { KpiPoliciesService } from './kpi-policies.service';

@Module({
  controllers: [KpiPoliciesController],
  providers: [KpiPoliciesService],
  exports: [KpiPoliciesService],
})
export class KpiPoliciesModule {}
