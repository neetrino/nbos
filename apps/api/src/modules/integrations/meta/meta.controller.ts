import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CurrentUser,
  type CurrentUserPayload,
  Public,
  RequirePermission,
} from '../../../common/decorators';
import { LinkMetaMarketingAccountDto } from './dto/link-meta-marketing-account.dto';
import { MetaAccountsService } from './meta-accounts.service';
import { MetaOAuthCallbackError } from './meta-oauth-callback.error';
import { MetaOAuthService } from './meta-oauth.service';
import { parseMetaOAuthPlatform } from './meta-oauth.platform';
import type { MetaMessagingWebhookBody, MetaOAuthErrorReason } from './meta.types';
import { MetaWebhookService } from './meta-webhook.service';
import type { HttpRequestParam } from './meta-webhook.helpers';
import type { MetaWebhookRequest } from './meta-webhook.types';

@ApiTags('Integrations / Meta')
@Controller('integrations/meta')
export class MetaController {
  private readonly logger = new Logger(MetaController.name);

  constructor(
    private readonly oauthService: MetaOAuthService,
    private readonly accountsService: MetaAccountsService,
    private readonly webhookService: MetaWebhookService,
  ) {}

  @Get('oauth/start')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Start Meta OAuth: returns Facebook or Instagram consent URL to open',
  })
  startOAuth(@CurrentUser() user: CurrentUserPayload, @Query('platform') platform: string) {
    const oauthPlatform = parseMetaOAuthPlatform(platform);
    return { url: this.oauthService.buildAuthUrl(user.id, oauthPlatform) };
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
      const errorId = randomUUID();
      this.logOAuthCallbackFailure(null, reasonFromQuery, errorId);
      res.redirect(this.oauthService.buildErrorRedirectUrl(reasonFromQuery, errorId));
      return;
    }
    if (!code || !state) {
      const errorId = randomUUID();
      this.logOAuthCallbackFailure(null, 'missing_code', errorId);
      res.redirect(this.oauthService.buildErrorRedirectUrl('missing_code', errorId));
      return;
    }
    try {
      const { redirectUrl } = await this.oauthService.handleCallback(code, state);
      res.redirect(redirectUrl);
    } catch (error) {
      const errorId = randomUUID();
      const reason = this.mapCallbackErrorToReason(error);
      this.logOAuthCallbackFailure(error, reason, errorId);
      res.redirect(this.oauthService.buildErrorRedirectUrl(reason, errorId));
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
    @Query('hub.mode') mode: HttpRequestParam,
    @Query('hub.verify_token') token: HttpRequestParam,
    @Query('hub.challenge') challenge: HttpRequestParam,
    @Res() res: Response,
  ) {
    const verifiedChallenge = this.webhookService.verifySubscription(mode, token, challenge);
    res
      .status(HttpStatus.OK)
      .set('Content-Type', 'text/plain; charset=utf-8')
      .set('X-Content-Type-Options', 'nosniff')
      .send(verifiedChallenge);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta webhook for Instagram/Facebook messaging events' })
  async receiveWebhook(
    @Req() req: MetaWebhookRequest,
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
    if (error instanceof MetaOAuthCallbackError) {
      return error.publicReason;
    }
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
      return 'meta_callback_failed';
    }
    if (error instanceof InternalServerErrorException) {
      return 'meta_callback_failed';
    }
    return 'unknown';
  }

  private logOAuthCallbackFailure(
    error: unknown,
    reason: MetaOAuthErrorReason,
    errorId: string,
    platformHint?: 'INSTAGRAM' | 'FACEBOOK',
  ): void {
    const typed = error instanceof MetaOAuthCallbackError ? error : null;
    const exceptionName = error instanceof Error ? error.constructor.name : typeof error;
    const httpStatus =
      error instanceof BadRequestException || error instanceof InternalServerErrorException
        ? error.getStatus()
        : undefined;

    const logPayload = {
      event: 'meta_oauth_callback_failed',
      errorId,
      platform: typed?.platform ?? platformHint,
      stage: typed?.stage,
      publicReason: reason,
      exceptionName,
      httpStatus,
      upstreamStatus: typed?.upstreamStatus,
      upstreamCode: typed?.upstreamCode,
      upstreamType: typed?.upstreamType,
      safeMessage: this.sanitizeOAuthErrorMessage(error),
      safeDetails: typed?.safeDetails,
    };

    this.logger.warn(logPayload);

    if (error instanceof Error && error.stack) {
      this.logger.debug(`Meta OAuth callback stack errorId=${errorId}`);
    }
  }

  private sanitizeOAuthErrorMessage(error: unknown): string {
    if (error instanceof MetaOAuthCallbackError) {
      return error.message;
    }
    if (error instanceof BadRequestException) {
      return this.extractErrorMessage(error.getResponse());
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
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
