import { Module } from '@nestjs/common';
import { UnitEconomicsController } from './unit-economics.controller';
import { UnitEconomicsListService } from './unit-economics-list.service';
import { UnitEconomicsOrderDetailService } from './unit-economics-order-detail.service';

@Module({
  controllers: [UnitEconomicsController],
  providers: [UnitEconomicsListService, UnitEconomicsOrderDetailService],
  exports: [UnitEconomicsListService, UnitEconomicsOrderDetailService],
})
export class UnitEconomicsModule {}
