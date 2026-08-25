import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { PlatformOwnershipService } from '../../platform-ownership/platform-ownership.service';
import { AuditService } from '../../audit/audit.service';
import {
  GOOGLE_CONTACTS_AUDIT_CONNECTED,
  GOOGLE_CONTACTS_AUDIT_ENTITY,
  GOOGLE_CONTACTS_CONNECTION_ID,
  GOOGLE_CONTACTS_SCOPE,
  GOOGLE_CONTACTS_SCOPES,
} from './google-contacts.constants';
import { GoogleContactsConfig } from './google-contacts.config';
import { resolveGoogleContactsRefreshToken } from './google-contacts-oauth.refresh-token';
import { GoogleContactsSecretStore } from './google-contacts-secret.store';
import { GoogleContactsQueueService } from './google-contacts-queue.service';

const STATE_TTL_SECONDS = 600;

interface GoogleContactsOAuthState {
  employeeId: string;
  purpose: 'google-contacts';
}

export type GoogleContactsOAuthErrorReason =
  | 'missing_code'
  | 'access_denied'
  | 'invalid_state'
  | 'not_owner'
  | 'token_exchange_failed'
  | 'missing_refresh_token'
  | 'insufficient_scope'
  | 'unknown';

@Injectable()
export class GoogleContactsOAuthService {
  private readonly jwtSecret: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: GoogleContactsConfig,
    private readonly secretStore: GoogleContactsSecretStore,
    private readonly queue: GoogleContactsQueueService,
    private readonly ownership: PlatformOwnershipService,
    private readonly audit: AuditService,
    configService: ConfigService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
  }

  requireConfigured(): void {
    if (!this.config.isConfigured()) {
      throw new BadRequestException(
        'Google Contacts is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }
  }

  buildAuthUrl(employeeId: string): string {
    this.requireConfigured();
    const state = jwt.sign(
      { employeeId, purpose: 'google-contacts' } satisfies GoogleContactsOAuthState,
      this.jwtSecret,
      { expiresIn: STATE_TTL_SECONDS },
    );
    return this.createOAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: false,
      scope: [...GOOGLE_CONTACTS_SCOPES],
      state,
    });
  }

  buildSuccessRedirectUrl(): string {
    return this.buildIntegrationsRedirectUrl({ google_contacts: 'connected' });
  }

  buildErrorRedirectUrl(reason: GoogleContactsOAuthErrorReason): string {
    return this.buildIntegrationsRedirectUrl({
      google_contacts: 'error',
      reason,
    });
  }

  async handleCallback(code: string, state: string): Promise<{ redirectUrl: string }> {
    this.requireConfigured();
    const employeeId = this.verifyState(state);
    await this.ownership.assertPlatformOwner(employeeId);
    const client = this.createOAuthClient();
    const tokens = await this.exchangeCodeForTokens(client, code);
    if (!this.hasContactsScope(tokens.scope)) {
      throw new BadRequestException(
        'Google Contacts permission was not granted. Revoke NBOS in Google Account settings, then connect again.',
      );
    }
    client.setCredentials(tokens);
    const googleEmail = await this.readGoogleEmail(client);
    const previous = await this.prisma.googleContactsConnection.findUnique({
      where: { id: GOOGLE_CONTACTS_CONNECTION_ID },
    });
    const emailChanged = Boolean(previous?.googleEmail) && previous?.googleEmail !== googleEmail;
    const existingToken = await this.secretStore.read();
    const refreshToken = resolveGoogleContactsRefreshToken(
      tokens.refresh_token,
      existingToken,
      emailChanged,
    );
    if (!refreshToken) {
      throw new BadRequestException(
        'Google did not return a refresh token; revoke NBOS access and connect again.',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      if (emailChanged) {
        await tx.googleContactMapping.deleteMany();
      }
      await tx.googleContactsConnection.upsert({
        where: { id: GOOGLE_CONTACTS_CONNECTION_ID },
        create: {
          id: GOOGLE_CONTACTS_CONNECTION_ID,
          googleEmail,
          status: 'CONNECTED',
          connectedByUserId: employeeId,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
        update: {
          googleEmail,
          status: 'CONNECTED',
          connectedByUserId: employeeId,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      });
      await this.secretStore.store(refreshToken, tx);
    });
    await this.audit.log({
      entityType: GOOGLE_CONTACTS_AUDIT_ENTITY,
      entityId: GOOGLE_CONTACTS_CONNECTION_ID,
      action: GOOGLE_CONTACTS_AUDIT_CONNECTED,
      userId: employeeId,
      changes: { googleEmail, mappingsReset: emailChanged },
    });
    await this.queue.enqueueAllActiveContacts();
    return { redirectUrl: this.buildSuccessRedirectUrl() };
  }

  mapCallbackError(error: unknown): GoogleContactsOAuthErrorReason {
    if (error instanceof ForbiddenException) {
      return 'not_owner';
    }
    if (error instanceof BadRequestException) {
      const message = String(error.message);
      if (message.includes('refresh token')) return 'missing_refresh_token';
      if (message.includes('permission')) return 'insufficient_scope';
      if (message.includes('state')) return 'invalid_state';
      if (message.includes('token exchange')) return 'token_exchange_failed';
    }
    if (error instanceof Error && error.message.includes('Platform owner')) {
      return 'not_owner';
    }
    return 'unknown';
  }

  private createOAuthClient() {
    return new google.auth.OAuth2(
      this.config.googleClientId,
      this.config.googleClientSecret,
      this.config.googleRedirectUri,
    );
  }

  private buildIntegrationsRedirectUrl(params: Record<string, string>): string {
    const url = new URL('/settings/integrations', this.config.appUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value.trim().length > 0) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }

  private verifyState(state: string): string {
    try {
      const payload = jwt.verify(state, this.jwtSecret) as GoogleContactsOAuthState;
      if (payload.purpose !== 'google-contacts' || !payload.employeeId) {
        throw new Error('bad state');
      }
      return payload.employeeId;
    } catch {
      throw new BadRequestException('Invalid or expired OAuth state');
    }
  }

  private async exchangeCodeForTokens(
    client: ReturnType<GoogleContactsOAuthService['createOAuthClient']>,
    code: string,
  ) {
    try {
      const { tokens } = await client.getToken(code);
      return tokens;
    } catch {
      throw new BadRequestException('OAuth token exchange failed');
    }
  }

  private hasContactsScope(scopeHeader: string | undefined): boolean {
    const granted = (scopeHeader ?? '').split(/\s+/);
    return granted.some((scope) => scope === GOOGLE_CONTACTS_SCOPE);
  }

  private async readGoogleEmail(
    client: ReturnType<GoogleContactsOAuthService['createOAuthClient']>,
  ): Promise<string> {
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const profile = await oauth2.userinfo.get();
    const email = profile.data.email?.trim().toLowerCase() ?? '';
    if (!email) {
      throw new BadRequestException('Google did not return an account email');
    }
    return email;
  }
}
