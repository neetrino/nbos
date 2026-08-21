import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CallsRecordingService } from './calls-recording.service';

const LEAD_PERMS = { CRM_LEADS_VIEW: 'OWN' };
const NONE_PERMS = { CRM_LEADS_VIEW: 'NONE', CRM_DEALS_VIEW: 'NONE' };

const CALL = {
  id: 'call-1',
  leadId: 'lead-1',
  contactId: 'contact-1',
  dealId: null,
  recordingStatus: 'READY',
  recordingFileAssetId: 'file-1',
};

describe('CallsRecordingService', () => {
  it('denies playback when the viewer cannot see the Call', async () => {
    const prisma = {
      atsCallEvent: { findUnique: vi.fn().mockResolvedValue(CALL) },
      fileAsset: { findFirst: vi.fn() },
    };
    const service = new CallsRecordingService(prisma as never, { ensureS3: vi.fn() } as never);

    await expect(service.streamRecording('call-1', NONE_PERMS)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.fileAsset.findFirst).not.toHaveBeenCalled();
  });

  it('does not stream when the recording is not READY', async () => {
    const prisma = {
      atsCallEvent: {
        findUnique: vi.fn().mockResolvedValue({ ...CALL, recordingStatus: 'PENDING' }),
      },
      fileAsset: { findFirst: vi.fn() },
    };
    const service = new CallsRecordingService(prisma as never, { ensureS3: vi.fn() } as never);

    await expect(service.streamRecording('call-1', LEAD_PERMS)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
