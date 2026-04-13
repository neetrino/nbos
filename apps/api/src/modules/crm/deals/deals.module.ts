import { Module } from '@nestjs/common';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { DealWonHandler } from './deal-won.handler';

@Module({
  controllers: [DealsController],
  providers: [DealsService, DealWonHandler],
  exports: [DealsService],
})
export class DealsModule {}
