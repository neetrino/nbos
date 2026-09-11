import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InvoiceOfficialWhatsAppModule } from '../finance/invoices/invoice-official-whatsapp.module';
import { WhatsAppGatewayModule } from '../integrations/whatsapp-gateway/whatsapp-gateway.module';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';

@Module({
  imports: [AuditModule, WhatsAppGatewayModule, InvoiceOfficialWhatsAppModule],
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
