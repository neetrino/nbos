import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleContactsConfig {
  constructor(private readonly config: ConfigService) {}

  get appUrl(): string {
    return this.config.get<string>('APP_URL')?.trim() || 'http://localhost:3000';
  }

  get backendUrl(): string {
    return this.config.getOrThrow<string>('BACKEND_URL').trim();
  }

  get googleClientId(): string {
    return this.config.get<string>('GOOGLE_CLIENT_ID')?.trim() ?? '';
  }

  get googleClientSecret(): string {
    return this.config.get<string>('GOOGLE_CLIENT_SECRET')?.trim() ?? '';
  }

  get googleRedirectUri(): string {
    return new URL('/api/integrations/google-contacts/oauth/callback', this.backendUrl).toString();
  }

  isConfigured(): boolean {
    return Boolean(this.googleClientId && this.googleClientSecret);
  }
}
