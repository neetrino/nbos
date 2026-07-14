import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { DriveModule } from '../../drive/drive.module';
import { PlatformAccessModule } from '../../platform-access/platform-access.module';
import { WhatsAppGatewayModule } from '../../integrations/whatsapp-gateway/whatsapp-gateway.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';
import { DealWonHandler } from './deal-won.handler';
import { DealCommercialHandoffService } from './deal-commercial-handoff.service';

@Module({
  imports: [AuditModule, DriveModule, PlatformAccessModule, WhatsAppGatewayModule],
  controllers: [DealsController],
  providers: [DealsService, DealWonHandler, DealCommercialHandoffService],
  exports: [DealsService, DealWonHandler, DealCommercialHandoffService],
})
export class DealsModule {}
