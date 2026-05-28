import { Module } from '@nestjs/common';
import { UnitEconomicsController } from './unit-economics.controller';
import { UnitEconomicsListService } from './unit-economics-list.service';

@Module({
  controllers: [UnitEconomicsController],
  providers: [UnitEconomicsListService],
  exports: [UnitEconomicsListService],
})
export class UnitEconomicsModule {}
