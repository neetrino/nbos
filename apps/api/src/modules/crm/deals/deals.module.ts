import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { DealWonHandler } from './deal-won.handler';

@Module({
  imports: [AuditModule],
  controllers: [DealsController],
  providers: [DealsService, DealWonHandler],
  exports: [DealsService],
})
export class DealsModule {}
