import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
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
} from '../../common/decorators';
import { ConnectCorporateMailboxDto } from './dto/connect-corporate-mailbox.dto';
import { MailConnectService } from './mail-connect.service';
import { MailGmailOAuthService, type GmailOAuthErrorReason } from './mail-gmail-oauth.service';
import { MailPubSubService } from './mail-pubsub.service';
import { MailService } from './mail.service';

type AuthedRequest = Request & { permissionScope?: string };

@ApiTags('Mail')
@ApiBearerAuth()
@Controller('mail')
export class MailProviderController {
  constructor(
    private readonly connectService: MailConnectService,
    private readonly gmailOAuthService: MailGmailOAuthService,
    private readonly pubSubService: MailPubSubService,
    private readonly mailService: MailService,
  ) {}

  @Post('accounts/corporate/connect')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Connect a corporate mailbox (validates IMAP + SMTP, then creates it)' })
  async connectCorporate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: ConnectCorporateMailboxDto,
  ) {
    return this.connectService.connectCorporate(user.id, body);
  }

  @Post('accounts/:accountId/disconnect')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Disconnect a mailbox (owner/admin only); deletes its stored secret' })
  async disconnect(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('accountId') accountId: string,
  ) {
    return this.connectService.disconnect(user.id, req.permissionScope ?? 'OWN', accountId);
  }

  @Post('accounts/:accountId/sync')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Trigger a provider sync for a mailbox (queued, or inline fallback)' })
  async syncAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('accountId') accountId: string,
  ) {
    return this.connectService.triggerSync(user.id, req.permissionScope ?? 'OWN', accountId);
  }

  @Get('accounts/:accountId/sync-logs')
  @RequirePermission('MAIL', 'VIEW')
  @ApiOperation({ summary: 'Recent sync/connection log entries for a mailbox' })
  async listSyncLogs(
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: AuthedRequest,
    @Param('accountId') accountId: string,
  ) {
    return this.mailService.listSyncLogs(user.id, req.permissionScope ?? 'OWN', accountId);
  }

  @Get('oauth/google/start')
  @RequirePermission('MAIL', 'EDIT')
  @ApiOperation({ summary: 'Start Gmail OAuth: returns the Google consent URL to open' })
  startGmailOAuth(@CurrentUser() user: CurrentUserPayload) {
    return { url: this.gmailOAuthService.buildAuthUrl(user.id) };
  }

  @Public()
  @Get('oauth/google/callback')
  @ApiOperation({ summary: 'Gmail OAuth callback (Google redirect); exchanges code and connects' })
  async gmailOAuthCallback(
    @Query('code') code: string,
    @Query('error') oauthError: string | undefined,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const reasonFromQuery = this.mapGoogleOAuthError(oauthError);
    if (reasonFromQuery !== null) {
      res.redirect(this.gmailOAuthService.buildErrorRedirectUrl(reasonFromQuery));
      return;
    }
    if (!code) {
      res.redirect(this.gmailOAuthService.buildErrorRedirectUrl('missing_code'));
      return;
    }
    try {
      const { redirectUrl } = await this.gmailOAuthService.handleCallback(code, state);
      res.redirect(redirectUrl);
    } catch (error) {
      const reason = this.mapCallbackErrorToReason(error);
      res.redirect(this.gmailOAuthService.buildErrorRedirectUrl(reason));
    }
  }

  @Public()
  @Post('pubsub/google')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Gmail Pub/Sub push endpoint (triggers mailbox sync)' })
  async gmailPubSubPush(
    @Query('token') token: string | undefined,
    @Body() body: { message?: { data?: string } },
  ) {
    await this.pubSubService.handlePush(token, body);
  }

  private mapGoogleOAuthError(error: string | undefined): GmailOAuthErrorReason | null {
    if (!error) {
      return null;
    }
    if (error === 'access_denied') {
      return 'access_denied';
    }
    return 'unknown';
  }

  private mapCallbackErrorToReason(error: unknown): GmailOAuthErrorReason {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();
      const message = this.extractErrorMessage(response).toLowerCase();
      if (message.includes('state')) {
        return 'invalid_state';
      }
      if (message.includes('modify permission')) {
        return 'insufficient_scope';
      }
      if (message.includes('refresh token')) {
        return 'missing_refresh_token';
      }
      if (message.includes('token exchange')) {
        return 'token_exchange_failed';
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
    if (!response || typeof response !== 'object') {
      return '';
    }
    const maybeMessage = (response as { message?: unknown }).message;
    if (Array.isArray(maybeMessage)) {
      return maybeMessage.filter((item): item is string => typeof item === 'string').join(' ');
    }
    return typeof maybeMessage === 'string' ? maybeMessage : '';
  }
}
