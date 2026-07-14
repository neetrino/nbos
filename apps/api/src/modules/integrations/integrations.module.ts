import { Module } from '@nestjs/common';
import { MetaModule } from './meta/meta.module';
import { WhatsAppGatewayModule } from './whatsapp-gateway/whatsapp-gateway.module';

@Module({
  imports: [MetaModule, WhatsAppGatewayModule],
  exports: [WhatsAppGatewayModule],
})
export class IntegrationsModule {}
