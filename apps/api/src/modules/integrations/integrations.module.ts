import { Module } from '@nestjs/common';
import { AtsModule } from './ats/ats.module';
import { GoogleContactsModule } from './google-contacts/google-contacts.module';
import { MetaModule } from './meta/meta.module';
import { WhatsAppGatewayModule } from './whatsapp-gateway/whatsapp-gateway.module';

@Module({
  imports: [AtsModule, MetaModule, WhatsAppGatewayModule, GoogleContactsModule],
  exports: [WhatsAppGatewayModule, GoogleContactsModule],
})
export class IntegrationsModule {}
