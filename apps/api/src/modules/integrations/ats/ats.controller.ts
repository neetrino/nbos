import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, SkipTransform } from '../../../common/decorators';
import { AtsWebhookService } from './ats-webhook.service';
import { ATS_WEBHOOK_SIP_QUERY } from './ats.constants';
import type { AtsWebhookSuccessResponse } from './ats.types';

@ApiTags('Integrations / ATS.am')
@Controller('integrations/ats')
export class AtsController {
  constructor(private readonly webhookService: AtsWebhookService) {}

  @Public()
  @SkipThrottle()
  @SkipTransform()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'ATS.am Active Call webhook (CRM Call + redirect_call)',
  })
  receiveWebhook(
    @Query('key') key: string | undefined,
    @Query(ATS_WEBHOOK_SIP_QUERY) sip: string | undefined,
    @Body() body: Record<string, unknown>,
  ): Promise<AtsWebhookSuccessResponse> {
    return this.webhookService.handleWebhook(key, body ?? {}, sip);
  }
}
