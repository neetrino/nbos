import { describe, expect, it, vi } from 'vitest';
import { AtsCallRecordingEnqueueService } from './ats-call-recording-enqueue.service';
import type { AtsCallRecordingQueueService } from './ats-call-recording-queue.service';
import type { AtsWebhookPayload } from './ats.types';

function payload(overrides: Partial<AtsWebhookPayload> = {}): AtsWebhookPayload {
  return {
    state: 'finish',
    uid: 'uid-1',
    input: null,
    clid: null,
    op: null,
    rate: null,
    billsec: null,
    calldirect: '0',
    disposition: 'ANSWERED',
    channel: null,
    recordLink: null,
    ...overrides,
  };
}

describe('AtsCallRecordingEnqueueService', () => {
  it('creates a download job and marks the call PENDING', async () => {
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'call-1',
          uid: 'uid-1',
          recordingStatus: null,
          recordingFileAssetId: null,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const enqueueDownload = vi.fn().mockResolvedValue(true);
    const service = new AtsCallRecordingEnqueueService(
      prisma as never,
      { enqueueDownload } as unknown as AtsCallRecordingQueueService,
    );

    await service.enqueueAfterWebhook(payload());

    expect(prisma.atsCallEvent.updateMany).toHaveBeenCalledWith({
      where: { id: 'call-1', recordingStatus: { not: 'READY' } },
      data: { recordingStatus: 'PENDING' },
    });
    expect(enqueueDownload).toHaveBeenCalledWith({ callId: 'call-1', uid: 'uid-1' });
  });

  it('does not enqueue when the recording is already READY', async () => {
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'call-1',
          uid: 'uid-1',
          recordingStatus: 'READY',
          recordingFileAssetId: 'file-1',
        }),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    const enqueueDownload = vi.fn();
    const service = new AtsCallRecordingEnqueueService(
      prisma as never,
      { enqueueDownload } as unknown as AtsCallRecordingQueueService,
    );

    await service.enqueueAfterWebhook(payload());

    expect(prisma.atsCallEvent.updateMany).not.toHaveBeenCalled();
    expect(enqueueDownload).not.toHaveBeenCalled();
  });

  it('enqueues a reprocess job for an already READY recording', async () => {
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'call-1',
          uid: 'uid-1',
          recordingStatus: 'READY',
          recordingFileAssetId: 'file-1',
        }),
      },
    };
    const enqueueReprocess = vi.fn().mockResolvedValue(true);
    const service = new AtsCallRecordingEnqueueService(
      prisma as never,
      { enqueueReprocess } as unknown as AtsCallRecordingQueueService,
    );

    await expect(service.enqueueReprocessForReadyCall('call-1')).resolves.toBe(true);
    expect(enqueueReprocess).toHaveBeenCalledWith({ callId: 'call-1', uid: 'uid-1' });
  });
});
