import { Module } from '@nestjs/common';

import { BonusPoliciesController } from './bonus-policies.controller';
import { BonusPoliciesService } from './bonus-policies.service';

@Module({
  controllers: [BonusPoliciesController],
  providers: [BonusPoliciesService],
  exports: [BonusPoliciesService],
})
export class BonusPoliciesModule {}
