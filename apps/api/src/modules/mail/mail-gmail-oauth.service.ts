import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { MailConnectService } from './mail-connect.service';
import { MailProviderConfig } from './providers/mail-provider.config';
import { MailProviderSecretStore } from './providers/mail-provider-secret.store';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];
const STATE_TTL_SECONDS = 600;

interface GmailOAuthState {
  employeeId: string;
}

@Injectable()
export class MailGmailOAuthService {
  private readonly jwtSecret: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: MailProviderConfig,
    private readonly secretStore: MailProviderSecretStore,
    private readonly connectService: MailConnectService,
    configService: ConfigService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
  }

  private requireConfigured(): void {
    if (!this.config.isGmailConfigured()) {
      throw new BadRequestException(
        'Gmail is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }
  }

  private createOAuthClient() {
    return new google.auth.OAuth2(
      this.config.googleClientId,
      this.config.googleClientSecret,
      this.config.googleRedirectUri,
    );
  }

  buildAuthUrl(employeeId: string): string {
    this.requireConfigured();
    const state = jwt.sign({ employeeId } satisfies GmailOAuthState, this.jwtSecret, {
      expiresIn: STATE_TTL_SECONDS,
    });
    return this.createOAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GMAIL_SCOPES,
      state,
    });
  }

  async handleCallback(code: string, state: string): Promise<{ redirectUrl: string }> {
    this.requireConfigured();
    const employeeId = this.verifyState(state);
    const client = this.createOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      throw new BadRequestException('Google did not return a refresh token; retry with consent');
    }
    client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const emailAddress = profile.data.emailAddress ?? '';
    const accountId = await this.upsertGmailAccount(employeeId, emailAddress);
    await this.secretStore.store(accountId, {
      kind: 'gmail',
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token ?? undefined,
      expiryDate: tokens.expiry_date ?? undefined,
    });
    await this.connectService.afterConnect(accountId, employeeId, emailAddress, 'GMAIL');
    return { redirectUrl: `${this.config.appUrl}/mail?connected=gmail` };
  }

  private verifyState(state: string): string {
    try {
      const payload = jwt.verify(state, this.jwtSecret) as GmailOAuthState;
      return payload.employeeId;
    } catch {
      throw new BadRequestException('Invalid or expired OAuth state');
    }
  }

  private async upsertGmailAccount(employeeId: string, emailAddress: string): Promise<string> {
    const existing = await this.prisma.mailAccount.findFirst({
      where: { ownerEmployeeId: employeeId, emailAddress, providerType: 'GMAIL' },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.mailProviderConnection.update({
        where: { mailAccountId: existing.id },
        data: { status: 'CONNECTED', providerAccountId: emailAddress, lastValidatedAt: new Date() },
      });
      await this.prisma.mailAccount.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE' },
      });
      return existing.id;
    }
    const created = await this.prisma.mailAccount.create({
      data: {
        ownerEmployeeId: employeeId,
        createdByEmployeeId: employeeId,
        emailAddress,
        providerType: 'GMAIL',
        status: 'ACTIVE',
        providerConnection: {
          create: {
            providerType: 'GMAIL',
            status: 'CONNECTED',
            providerAccountId: emailAddress,
            grantedScopes: GMAIL_SCOPES,
            lastValidatedAt: new Date(),
          },
        },
      },
      select: { id: true },
    });
    return created.id;
  }
}
