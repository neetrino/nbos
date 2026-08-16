import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AtsWebhookService } from './ats-webhook.service';
import type { AtsCallRedirectService } from './ats-call-redirect.service';
import type { AtsProviderConfig } from './ats-provider.config';
import type { AtsLeadIngestService } from './ats-lead-ingest.service';

function createService(options: {
  apiKey?: string;
  ingest?: AtsLeadIngestService['ingestCallEvent'];
  resolveRedirect?: AtsCallRedirectService['resolveRedirectCall'];
}): AtsWebhookService {
  const config = {
    apiKey: options.apiKey ?? 'test-ats-key',
    isConfigured: () => (options.apiKey ?? 'test-ats-key').length > 0,
  } as AtsProviderConfig;

  const leadIngest = {
    ingestCallEvent: options.ingest ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as AtsLeadIngestService;

  const callRedirect = {
    resolveRedirectCall: options.resolveRedirect ?? vi.fn().mockResolvedValue(null),
  } as unknown as AtsCallRedirectService;

  return new AtsWebhookService(config, leadIngest, callRedirect);
}

const startBody: Record<string, unknown> = {
  uid: 'call-1',
  state: 'start',
  calldirect: '0',
  clid: '+37499123456',
};

describe('AtsWebhookService', () => {
  it('rejects when ATS_API_KEY is not configured (503)', async () => {
    const service = createService({ apiKey: '' });
    await expect(service.handleWebhook('any', startBody)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('rejects missing or wrong key with 401', async () => {
    const ingest = vi.fn();
    const service = createService({ ingest });

    await expect(service.handleWebhook(undefined, startBody)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.handleWebhook('wrong', startBody)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(ingest).not.toHaveBeenCalled();
  });

  it('returns success and ingests on valid key', async () => {
    const ingest = vi.fn().mockResolvedValue(undefined);
    const service = createService({ ingest });

    await expect(service.handleWebhook('test-ats-key', startBody)).resolves.toEqual({
      status: 'success',
    });
    expect(ingest).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'call-1',
        state: 'start',
        calldirect: '0',
        clid: '+37499123456',
      }),
    );
  });

  it('includes redirect_call when redirect service returns a SIP id', async () => {
    const resolveRedirect = vi.fn().mockResolvedValue('3126107');
    const service = createService({ resolveRedirect });

    await expect(service.handleWebhook('test-ats-key', startBody)).resolves.toEqual({
      status: 'success',
      redirect_call: '3126107',
    });
  });
});
