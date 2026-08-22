import { describe, expect, it, vi } from 'vitest';
import {
  AtsRecordingPermanentError,
  AtsRecordingTransientError,
} from './ats-call-recording.errors';
import { AtsCallRecordingDownloadService } from './ats-call-recording-download.service';

const CALL = {
  id: 'call-1',
  uid: 'uid-1',
  recordLink: null,
  leadId: 'lead-1',
  contactId: 'contact-1',
  answeredEmployeeId: 'emp-1',
  responsibleEmployeeId: 'emp-1',
  recordingStatus: 'PENDING',
  recordingFileAssetId: null,
};

vi.mock('./ats-call-recording-store', () => ({
  storeAtsCallRecording: vi.fn().mockResolvedValue('file-1'),
}));

describe('AtsCallRecordingDownloadService', () => {
  it('downloads an available recording, stores a FileAsset, and marks READY', async () => {
    const { storeAtsCallRecording } = await import('./ats-call-recording-store');
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue(CALL),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn(),
      },
    };
    const client = {
      downloadRecording: vi.fn().mockResolvedValue({
        tmpPath: '/tmp/rec',
        mimeType: 'audio/wav',
        sizeBytes: 12,
        checksum: 'abc',
      }),
    };
    const service = new AtsCallRecordingDownloadService(
      prisma as never,
      client as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.processJob({ callId: 'call-1', uid: 'uid-1' });

    expect(client.downloadRecording).toHaveBeenCalledWith('uid-1', null);
    expect(storeAtsCallRecording).toHaveBeenCalled();
    expect(prisma.atsCallEvent.update).toHaveBeenCalledWith({
      where: { id: 'call-1' },
      data: { recordingStatus: 'READY', recordingFileAssetId: 'file-1' },
    });
  });

  it('rethrows a temporary ATS failure so BullMQ can retry', async () => {
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue(CALL),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn(),
      },
    };
    const client = {
      downloadRecording: vi.fn().mockRejectedValue(new AtsRecordingTransientError('HTTP 404')),
    };
    const service = new AtsCallRecordingDownloadService(
      prisma as never,
      client as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.processJob({ callId: 'call-1', uid: 'uid-1' }, 0, 5),
    ).rejects.toBeInstanceOf(AtsRecordingTransientError);
    expect(prisma.atsCallEvent.updateMany).not.toHaveBeenCalled();
  });

  it('marks FAILED after retries are exhausted and keeps the Call row', async () => {
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue(CALL),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const client = {
      downloadRecording: vi.fn().mockRejectedValue(new AtsRecordingTransientError('HTTP 404')),
    };
    const service = new AtsCallRecordingDownloadService(
      prisma as never,
      client as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.processJob({ callId: 'call-1', uid: 'uid-1' }, 4, 5),
    ).rejects.toBeInstanceOf(AtsRecordingTransientError);
    expect(prisma.atsCallEvent.updateMany).toHaveBeenCalledWith({
      where: { id: 'call-1', recordingStatus: { not: 'READY' } },
      data: { recordingStatus: 'FAILED' },
    });
    expect(prisma.atsCallEvent.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: undefined }) }),
    );
  });

  it('marks FAILED immediately on a permanent ATS error without throwing', async () => {
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue(CALL),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const client = {
      downloadRecording: vi.fn().mockRejectedValue(new AtsRecordingPermanentError('HTTP 403')),
    };
    const service = new AtsCallRecordingDownloadService(
      prisma as never,
      client as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.processJob({ callId: 'call-1', uid: 'uid-1' })).resolves.toBeUndefined();
    expect(prisma.atsCallEvent.updateMany).toHaveBeenCalledWith({
      where: { id: 'call-1', recordingStatus: { not: 'READY' } },
      data: { recordingStatus: 'FAILED' },
    });
  });

  it('marks FAILED on a URL policy denial without storing to Drive/R2', async () => {
    const { storeAtsCallRecording } = await import('./ats-call-recording-store');
    vi.mocked(storeAtsCallRecording).mockClear();
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue({
          ...CALL,
          recordLink: 'https://127.0.0.1/r.wav',
        }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const client = {
      downloadRecording: vi
        .fn()
        .mockRejectedValue(new AtsRecordingPermanentError('recording url rejected (ip_literal)')),
    };
    const service = new AtsCallRecordingDownloadService(
      prisma as never,
      client as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.processJob({ callId: 'call-1', uid: 'uid-1' })).resolves.toBeUndefined();
    expect(storeAtsCallRecording).not.toHaveBeenCalled();
    expect(prisma.atsCallEvent.updateMany).toHaveBeenCalledWith({
      where: { id: 'call-1', recordingStatus: { not: 'READY' } },
      data: { recordingStatus: 'FAILED' },
    });
  });

  it('does not download again when the Call already has a READY FileAsset', async () => {
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue({
          ...CALL,
          recordingStatus: 'READY',
          recordingFileAssetId: 'file-1',
        }),
        update: vi.fn(),
      },
    };
    const client = { downloadRecording: vi.fn() };
    const service = new AtsCallRecordingDownloadService(
      prisma as never,
      client as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.processJob({ callId: 'call-1', uid: 'uid-1' });

    expect(client.downloadRecording).not.toHaveBeenCalled();
    expect(prisma.atsCallEvent.update).not.toHaveBeenCalled();
  });
});
