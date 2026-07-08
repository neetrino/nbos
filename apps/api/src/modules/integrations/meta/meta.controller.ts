import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type CurrentUserPayload,
  Public,
  RequirePermission,
} from '../../../common/decorators';
import { LinkMetaMarketingAccountDto } from './dto/link-meta-marketing-account.dto';
import { MetaAccountsService } from './meta-accounts.service';
import { MetaOAuthService } from './meta-oauth.service';
import type { MetaMessagingWebhookBody, MetaOAuthErrorReason } from './meta.types';
import { MetaWebhookService } from './meta-webhook.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('Integrations / Meta')
@Controller('integrations/meta')
export class MetaController {
  constructor(
    private readonly oauthService: MetaOAuthService,
    private readonly accountsService: MetaAccountsService,
    private readonly webhookService: MetaWebhookService,
  ) {}

  @Get('oauth/start')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Meta OAuth: returns the Facebook consent URL to open' })
  startOAuth(@CurrentUser() user: CurrentUserPayload) {
    return { url: this.oauthService.buildAuthUrl(user.id) };
  }

  @Public()
  @Get('oauth/callback')
  @ApiOperation({ summary: 'Meta OAuth callback (Facebook redirect); exchanges code and connects' })
  async oauthCallback(
    @Query('code') code: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Query('error_reason') errorReason: string | undefined,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ) {
    const reasonFromQuery = this.mapMetaOAuthError(oauthError, errorReason);
    if (reasonFromQuery !== null) {
      res.redirect(this.oauthService.buildErrorRedirectUrl(reasonFromQuery));
      return;
    }
    if (!code || !state) {
      res.redirect(this.oauthService.buildErrorRedirectUrl('missing_code'));
      return;
    }
    try {
      const { redirectUrl } = await this.oauthService.handleCallback(code, state);
      res.redirect(redirectUrl);
    } catch (error) {
      const reason = this.mapCallbackErrorToReason(error);
      res.redirect(this.oauthService.buildErrorRedirectUrl(reason));
    }
  }

  @Get('accounts')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List connected Meta accounts (Instagram / Facebook)' })
  listAccounts() {
    return this.accountsService.listAccounts();
  }

  @Patch('accounts/:id/marketing-account')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link or unlink a MarketingAccount for Meta DM lead attribution' })
  linkMarketingAccount(@Param('id') id: string, @Body() body: LinkMetaMarketingAccountDto) {
    return this.accountsService.linkMarketingAccount(id, body.marketingAccountId ?? null);
  }

  @Delete('accounts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('COMPANY', 'EDIT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect a Meta connected account and delete stored secrets' })
  async disconnect(@Param('id') id: string) {
    await this.accountsService.disconnect(id);
  }

  @Public()
  @Get('webhook')
  @ApiOperation({ summary: 'Meta webhook verification (hub.challenge)' })
  verifyWebhook(
    @Query('hub.mode') mode: string | undefined,
    @Query('hub.verify_token') token: string | undefined,
    @Query('hub.challenge') challenge: string | undefined,
    @Res() res: Response,
  ) {
    const verified = this.webhookService.verifySubscription(mode, token, challenge);
    res.status(HttpStatus.OK).type('text/plain').send(verified);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta webhook for Instagram/Facebook messaging events' })
  async receiveWebhook(
    @Req() req: RawBodyRequest,
    @Body() body: MetaMessagingWebhookBody,
    @Res() res: Response,
  ) {
    const signature = req.headers['x-hub-signature-256'];
    const signatureHeader = typeof signature === 'string' ? signature : signature?.[0];
    await this.webhookService.handleWebhook(req, signatureHeader, body);
    res.sendStatus(HttpStatus.OK);
  }

  private mapMetaOAuthError(
    error: string | undefined,
    errorReason: string | undefined,
  ): MetaOAuthErrorReason | null {
    if (!error) {
      return null;
    }
    if (error === 'access_denied' || errorReason === 'user_denied') {
      return 'access_denied';
    }
    return 'unknown';
  }

  private mapCallbackErrorToReason(error: unknown): MetaOAuthErrorReason {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();
      const message = this.extractErrorMessage(response).toLowerCase();
      if (message.includes('state')) {
        return 'invalid_state';
      }
      if (message.includes('token')) {
        return 'token_exchange_failed';
      }
      if (message.includes('no facebook pages')) {
        return 'missing_pages';
      }
      if (message.includes('not configured')) {
        return 'not_configured';
      }
      return 'unknown';
    }
    if (error instanceof InternalServerErrorException) {
      return 'unknown';
    }
    return 'unknown';
  }

  private extractErrorMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }
    if ('message' in response && typeof response.message === 'string') {
      return response.message;
    }
    if ('message' in response && Array.isArray(response.message)) {
      return response.message.join(', ');
    }
    return 'Unknown error';
  }
}
