import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type CurrentUserPayload,
  Public,
  RequirePermission,
} from '../../common/decorators';
import { ConnectCorporateMailboxDto } from './dto/connect-corporate-mailbox.dto';
import { MailConnectService } from './mail-connect.service';
import { MailGmailOAuthService } from './mail-gmail-oauth.service';
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
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const { redirectUrl } = await this.gmailOAuthService.handleCallback(code, state);
    res.redirect(redirectUrl);
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
}
