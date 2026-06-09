import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Mail provider environment config. Gmail values come from the Google Cloud
 * OAuth client; they are optional so the corporate (IMAP/SMTP) flow works
 * without any external Google setup.
 */
@Injectable()
export class MailProviderConfig {
  constructor(private readonly config: ConfigService) {}

  get appUrl(): string {
    return this.config.get<string>('APP_URL')?.trim() || 'http://localhost:3000';
  }

  get apiPublicUrl(): string {
    return this.config.get<string>('API_PUBLIC_URL')?.trim() || 'http://localhost:4000';
  }

  get googleClientId(): string {
    return this.config.get<string>('GOOGLE_CLIENT_ID')?.trim() ?? '';
  }

  get googleClientSecret(): string {
    return this.config.get<string>('GOOGLE_CLIENT_SECRET')?.trim() ?? '';
  }

  get googleRedirectUri(): string {
    return (
      this.config.get<string>('MAIL_GMAIL_REDIRECT_URI')?.trim() ||
      `${this.apiPublicUrl}/api/mail/oauth/google/callback`
    );
  }

  get gmailPubsubTopic(): string | null {
    return this.config.get<string>('MAIL_GMAIL_PUBSUB_TOPIC')?.trim() || null;
  }

  /** Shared secret to verify Gmail Pub/Sub push requests (query token). */
  get gmailPubsubVerificationToken(): string | null {
    return this.config.get<string>('MAIL_GMAIL_PUBSUB_TOKEN')?.trim() || null;
  }

  isGmailConfigured(): boolean {
    return Boolean(this.googleClientId && this.googleClientSecret);
  }
}
