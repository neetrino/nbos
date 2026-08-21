import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AtsWebhookService } from './ats-webhook.service';
import type { AtsCallRecordingEnqueueService } from './ats-call-recording-enqueue.service';
import type { AtsCallRedirectService } from './ats-call-redirect.service';
import type { AtsCallRealtimePublisher } from './ats-call-realtime.publisher';
import type { AtsCallService } from './ats-call.service';
import type { AtsProviderConfig } from './ats-provider.config';

function createService(options: {
  apiKey?: string;
  ingest?: AtsCallService['ingestCallEvent'];
  resolveRedirect?: AtsCallRedirectService['resolveRedirectCall'];
  publish?: AtsCallRealtimePublisher['publishAfterWebhook'];
  enqueueRecording?: AtsCallRecordingEnqueueService['enqueueAfterWebhook'];
}): AtsWebhookService {
  const config = {
    apiKey: options.apiKey ?? 'test-ats-key',
    isConfigured: () => (options.apiKey ?? 'test-ats-key').length > 0,
  } as AtsProviderConfig;

  const callService = {
    ingestCallEvent:
      options.ingest ?? vi.fn().mockResolvedValue({ callId: 'call-1', isFirstSeen: true }),
  } as unknown as AtsCallService;

  const callRedirect = {
    resolveRedirectCall: options.resolveRedirect ?? vi.fn().mockResolvedValue(null),
  } as unknown as AtsCallRedirectService;

  const publisher = {
    publishAfterWebhook: options.publish ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as AtsCallRealtimePublisher;

  const recordingEnqueue = {
    enqueueAfterWebhook: options.enqueueRecording ?? vi.fn().mockResolvedValue(undefined),
  } as unknown as AtsCallRecordingEnqueueService;

  return new AtsWebhookService(config, callService, callRedirect, publisher, recordingEnqueue);
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

  it('publishes call lifecycle SSE after ingest', async () => {
    const ingest = vi.fn().mockResolvedValue({ callId: 'evt-1', isFirstSeen: true });
    const publish = vi.fn().mockResolvedValue(undefined);
    const service = createService({ ingest, publish });

    await service.handleWebhook('test-ats-key', startBody);
    expect(ingest).toHaveBeenCalled();
    expect(publish).toHaveBeenCalledWith(expect.objectContaining({ uid: 'call-1' }), {
      callId: 'evt-1',
      isFirstSeen: true,
    });
    expect(ingest).toHaveBeenCalledBefore(publish);
  });

  it('still returns success when SSE publish throws', async () => {
    const ingest = vi.fn().mockResolvedValue({ callId: 'evt-1', isFirstSeen: true });
    const publish = vi.fn().mockRejectedValue(new Error('sse down'));
    const service = createService({ ingest, publish });

    await expect(service.handleWebhook('test-ats-key', startBody)).resolves.toEqual({
      status: 'success',
    });
    expect(ingest).toHaveBeenCalled();
  });

  it('enqueues recording after ingest on a terminal call', async () => {
    const ingest = vi.fn().mockResolvedValue(undefined);
    const enqueueRecording = vi.fn().mockResolvedValue(undefined);
    const finishBody = { uid: 'call-1', state: 'finish', disposition: 'ANSWERED' };
    const service = createService({ ingest, enqueueRecording });

    await expect(service.handleWebhook('test-ats-key', finishBody)).resolves.toEqual({
      status: 'success',
    });
    expect(ingest).toHaveBeenCalled();
    expect(enqueueRecording).toHaveBeenCalledWith(expect.objectContaining({ uid: 'call-1' }));
  });

  it('still returns success when recording enqueue throws', async () => {
    const ingest = vi.fn().mockResolvedValue(undefined);
    const enqueueRecording = vi.fn().mockRejectedValue(new Error('redis down'));
    const service = createService({ ingest, enqueueRecording });

    await expect(service.handleWebhook('test-ats-key', startBody)).resolves.toEqual({
      status: 'success',
    });
    expect(ingest).toHaveBeenCalled();
  });
});
