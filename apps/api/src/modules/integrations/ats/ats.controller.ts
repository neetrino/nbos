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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators';
import { AtsWebhookService } from './ats-webhook.service';
import type { AtsWebhookSuccessResponse } from './ats.types';

@ApiTags('Integrations / ATS.am')
@Controller('integrations/ats')
export class AtsController {
  constructor(private readonly webhookService: AtsWebhookService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'ATS.am Active Call webhook (inbound → CRM Lead; no Contact)',
  })
  receiveWebhook(
    @Query('key') key: string | undefined,
    @Body() body: Record<string, unknown>,
  ): Promise<AtsWebhookSuccessResponse> {
    return this.webhookService.handleWebhook(key, body ?? {});
  }
}
