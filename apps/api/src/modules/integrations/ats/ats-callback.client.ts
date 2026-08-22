import { Injectable, Logger } from '@nestjs/common';
import { ATS_CALLBACK_ENDPOINT, ATS_CALLBACK_TIMEOUT_MS } from './ats.constants';
import { AtsProviderConfig } from './ats-provider.config';
import type { AtsCallbackCallInput, AtsCallbackCallResult } from './ats-callback.types';

export type { AtsCallbackCallInput, AtsCallbackCallResult } from './ats-callback.types';

@Injectable()
export class AtsCallbackClient {
  private readonly logger = new Logger(AtsCallbackClient.name);

  constructor(private readonly config: AtsProviderConfig) {}

  async startCallbackCall(input: AtsCallbackCallInput): Promise<AtsCallbackCallResult> {
    if (!this.config.isConfigured()) {
      return { kind: 'unconfigured' };
    }
    const url = this.buildCallbackUrl(input.from, input.to);
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(ATS_CALLBACK_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn({
          event: 'ats_callback_http_error',
          status: response.status,
        });
        return { kind: 'rejected' };
      }
      const accepted = await isAtsCallbackSuccessBody(response);
      return { kind: accepted ? 'accepted' : 'rejected' };
    } catch (error) {
      this.logger.warn({
        event: 'ats_callback_network_error',
        error: String(error),
      });
      return { kind: 'unknown' };
    }
  }

  private buildCallbackUrl(from: string, to: string): string {
    const url = new URL(ATS_CALLBACK_ENDPOINT);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
    return url.toString();
  }
}

export async function isAtsCallbackSuccessBody(response: Response): Promise<boolean> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json')) {
    return true;
  }
  const body: unknown = await response.json().catch(() => null);
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return true;
  }
  const record = body as Record<string, unknown>;
  if (typeof record.error === 'string' && record.error.trim().length > 0) {
    return false;
  }
  if (typeof record.status === 'string') {
    const status = record.status.trim().toLowerCase();
    if (status === 'error' || status === 'fail' || status === 'failed') {
      return false;
    }
  }
  if (record.success === false) {
    return false;
  }
  return true;
}
