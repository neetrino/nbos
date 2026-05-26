import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { DriveModule } from '../../drive/drive.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { DealWonHandler } from './deal-won.handler';

@Module({
  imports: [AuditModule, DriveModule],
  controllers: [DealsController],
  providers: [DealsService, DealWonHandler, DealCommercialHandoffService],
  exports: [DealsService, DealWonHandler, DealCommercialHandoffService],
})
export class DealsModule {}
