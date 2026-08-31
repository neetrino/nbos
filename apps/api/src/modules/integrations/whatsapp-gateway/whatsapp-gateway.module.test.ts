import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { DealWhatsAppGroupCreateHandler } from './deal-whatsapp-group-create.handler';
import { WhatsAppGatewayModule } from './whatsapp-gateway.module';

describe('WhatsAppGatewayModule', () => {
  it('exports DealWhatsAppGroupCreateHandler for QueueWorkersModule', () => {
    const exported = Reflect.getMetadata(
      MODULE_METADATA.EXPORTS,
      WhatsAppGatewayModule,
    ) as unknown[];
    expect(exported).toContain(DealWhatsAppGroupCreateHandler);
  });
});
