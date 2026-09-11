import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators';
import { WhatsAppGatewayWebhookService } from './whatsapp-gateway-webhook.service';
import type { WhatsAppGatewayWebhookBody } from './whatsapp-gateway-webhook.types';

type RawBodyRequest = { rawBody?: Buffer };

@ApiTags('Integrations / WhatsApp Gateway')
@Controller('integrations/whatsapp-gateway')
export class WhatsAppGatewayWebhookController {
  constructor(private readonly webhooks: WhatsAppGatewayWebhookService) {}

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gateway Project webhook for MESSENGER inbound events' })
  receiveWebhook(
    @Req() req: RawBodyRequest,
    @Headers('x-gateway-event-id') eventId: string | undefined,
    @Headers('x-gateway-timestamp') timestamp: string | undefined,
    @Headers('x-gateway-signature') signature: string | undefined,
    @Headers('x-gateway-signature-algorithm') algorithm: string | undefined,
    @Body() body: WhatsAppGatewayWebhookBody,
  ) {
    return this.webhooks.handleWebhook(
      req.rawBody,
      { eventId, timestamp, signature, algorithm },
      body ?? {},
    );
  }
}
