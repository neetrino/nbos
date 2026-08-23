import { describe, expect, it, vi } from 'vitest';
import { storeAtsCallRecording } from './ats-call-recording-store';

const CALL = {
  id: 'call-1',
  uid: 'uid-1',
  leadId: 'lead-1',
  contactId: 'contact-1',
  answeredEmployeeId: 'emp-1',
  responsibleEmployeeId: 'emp-1',
};

const DOWNLOAD = {
  tmpPath: '/tmp/rec',
  mimeType: 'audio/wav',
  sizeBytes: 8,
  checksum: 'hash',
};

describe('storeAtsCallRecording', () => {
  it('reuses an existing CALL FileLink instead of creating a second FileAsset', async () => {
    const prisma = {
      fileLink: {
        findFirst: vi.fn().mockResolvedValue({ fileAssetId: 'file-1' }),
        create: vi.fn(),
      },
      fileAsset: { findFirst: vi.fn() },
    };
    const drive = { createFileAsset: vi.fn() };
    const r2 = { ensureS3: vi.fn(), bucket: 'bucket' };

    const id = await storeAtsCallRecording({
      prisma: prisma as never,
      drive: drive as never,
      r2: r2 as never,
      config: {} as never,
      call: CALL,
      download: DOWNLOAD,
    });

    expect(id).toBe('file-1');
    expect(drive.createFileAsset).not.toHaveBeenCalled();
    expect(r2.ensureS3).not.toHaveBeenCalled();
  });
});
