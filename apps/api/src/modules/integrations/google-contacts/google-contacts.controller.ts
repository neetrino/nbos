import { Controller, Delete, Get, HttpCode, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, Public, type CurrentUserPayload } from '../../../common/decorators';
import { PlatformOwnershipService } from '../../platform-ownership/platform-ownership.service';
import { GoogleContactsConnectionService } from './google-contacts-connection.service';
import { GoogleContactsOAuthService } from './google-contacts-oauth.service';

@ApiTags('Integrations / Google Contacts')
@Controller('integrations/google-contacts')
export class GoogleContactsController {
  constructor(
    private readonly connection: GoogleContactsConnectionService,
    private readonly oauth: GoogleContactsOAuthService,
    private readonly ownership: PlatformOwnershipService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Google Contacts connection status (Founder only)' })
  getConnection(@CurrentUser() user: CurrentUserPayload) {
    return this.connection.getPublicView(user.id);
  }

  @Post('oauth/start')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Google Contacts OAuth (Founder only)' })
  async startOAuth(@CurrentUser() user: CurrentUserPayload) {
    await this.ownership.assertPlatformOwner(user.id);
    this.oauth.requireConfigured();
    return { url: this.oauth.buildAuthUrl(user.id) };
  }

  @Public()
  @Get('oauth/callback')
  @ApiOperation({ summary: 'Google Contacts OAuth callback' })
  async oauthCallback(
    @Query('code') code: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ) {
    if (oauthError === 'access_denied') {
      res.redirect(this.oauth.buildErrorRedirectUrl('access_denied'));
      return;
    }
    if (!code || !state) {
      res.redirect(this.oauth.buildErrorRedirectUrl('missing_code'));
      return;
    }
    try {
      const { redirectUrl } = await this.oauth.handleCallback(code, state);
      res.redirect(redirectUrl);
    } catch (error) {
      res.redirect(this.oauth.buildErrorRedirectUrl(this.oauth.mapCallbackError(error)));
    }
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enqueue sync of all active contacts (Founder only)' })
  syncNow(@CurrentUser() user: CurrentUserPayload) {
    return this.connection.syncNow(user.id);
  }

  @Delete()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google Contacts (Founder only)' })
  disconnect(@CurrentUser() user: CurrentUserPayload) {
    return this.connection.disconnect(user.id);
  }
}
