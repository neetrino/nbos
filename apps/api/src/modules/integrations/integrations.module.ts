import { Module } from '@nestjs/common';
import { AtsModule } from './ats/ats.module';
import { MetaModule } from './meta/meta.module';
import { WhatsAppGatewayModule } from './whatsapp-gateway/whatsapp-gateway.module';

@Module({
  imports: [AtsModule, MetaModule, WhatsAppGatewayModule],
  exports: [WhatsAppGatewayModule],
})
export class IntegrationsModule {}
