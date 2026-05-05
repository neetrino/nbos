import { Module } from '@nestjs/common';
import { BonusController } from './bonus.controller';
import { BonusService } from './bonus.service';
import { BonusReleaseService } from './bonus-release.service';
import { SalesBonusAccrualService } from './sales-bonus-accrual.service';
import { SalesBonusPolicyService } from './sales-bonus-policy.service';

@Module({
  controllers: [BonusController],
  providers: [BonusService, BonusReleaseService, SalesBonusAccrualService, SalesBonusPolicyService],
  exports: [BonusService, BonusReleaseService, SalesBonusAccrualService, SalesBonusPolicyService],
})
export class BonusModule {}
