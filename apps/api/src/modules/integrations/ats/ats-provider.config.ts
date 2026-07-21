import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * ATS.am integration env. Optional at boot (API starts without telephony);
 * webhook rejects when `ATS_API_KEY` is unset.
 */
@Injectable()
export class AtsProviderConfig {
  constructor(private readonly config: ConfigService) {}

  get apiKey(): string {
    return this.config.get<string>('ATS_API_KEY')?.trim() ?? '';
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }
}
