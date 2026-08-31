import { Module } from '@nestjs/common';
import { WhatsAppGatewayModule } from '../../integrations/whatsapp-gateway/whatsapp-gateway.module';
import { InvoiceOfficialWhatsAppService } from './invoice-official-whatsapp.service';

@Module({
  imports: [WhatsAppGatewayModule],
  providers: [InvoiceOfficialWhatsAppService],
  exports: [InvoiceOfficialWhatsAppService],
})
export class InvoiceOfficialWhatsAppModule {}
