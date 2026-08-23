import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ATS_RECORDING_ALLOWED_HOSTS_ENV } from './ats-recording-url.constants';
import { parseAtsRecordingAllowedHosts } from './ats-recording-url';

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

  /**
   * Exact HTTPS hostnames allowed for `call-record` and `record_link`.
   * Always includes `account.ats.am`. Extra hosts: `ATS_RECORDING_ALLOWED_HOSTS`.
   */
  get recordingAllowedHosts(): readonly string[] {
    return parseAtsRecordingAllowedHosts(this.config.get<string>(ATS_RECORDING_ALLOWED_HOSTS_ENV));
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }
}
