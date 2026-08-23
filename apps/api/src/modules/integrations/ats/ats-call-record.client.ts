import { Injectable, Logger } from '@nestjs/common';
import { ATS_CALL_RECORD_ENDPOINT } from './ats-call-recording.constants';
import { AtsRecordingPermanentError } from './ats-call-recording.errors';
import type { AtsRecordingDownloadResult } from './ats-call-record.types';
import { AtsProviderConfig } from './ats-provider.config';
import { AtsRecordingSafeDownloadService } from './ats-recording-safe-download.service';

export type { AtsRecordingDownloadResult } from './ats-call-record.types';

@Injectable()
export class AtsCallRecordClient {
  private readonly logger = new Logger(AtsCallRecordClient.name);

  constructor(
    private readonly config: AtsProviderConfig,
    private readonly downloader: AtsRecordingSafeDownloadService,
  ) {}

  async downloadRecording(
    uid: string,
    fallbackUrl: string | null,
  ): Promise<AtsRecordingDownloadResult> {
    try {
      return await this.downloader.download(this.callRecordUrl(uid), 'ats-call-record');
    } catch (error) {
      if (error instanceof AtsRecordingPermanentError || !fallbackUrl?.trim()) {
        throw error;
      }
      this.logger.warn({
        event: 'ats_call_record_fallback_record_link',
        uid,
      });
      return this.downloader.download(fallbackUrl.trim(), 'ats-record-link');
    }
  }

  private callRecordUrl(uid: string): string {
    const url = new URL(ATS_CALL_RECORD_ENDPOINT);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('uid', uid);
    return url.toString();
  }
}
