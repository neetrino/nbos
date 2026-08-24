import { ForbiddenException, NotFoundException, StreamableFile } from '@nestjs/common';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CRM_CALL_RECORDINGS_PLAY_PERMISSION } from '@nbos/shared';
import type { CurrentUserPayload } from '../../../common/decorators';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { findAccessibleFileAssetStorage } from '../../drive/drive-accessible-file.op';
import { CallAccessPolicyService } from './call-access-policy.service';
import { ACTOR_ID, OWN_ACTOR } from './call-access.test-support';
import { CallsRecordingService } from './calls-recording.service';

vi.mock('../../drive/drive-accessible-file.op', () => ({
  findAccessibleFileAssetStorage: vi.fn(),
}));

const findAccessible = vi.mocked(findAccessibleFileAssetStorage);

const READY_CALL = {
  id: 'call-1',
  recordingStatus: 'READY',
  recordingFileAssetId: 'file-1',
};

const PLAY = { [CRM_CALL_RECORDINGS_PLAY_PERMISSION]: 'ALL' } as const;

function playbackUser(
  permissions: Record<string, string>,
  overrides: Partial<CurrentUserPayload> = {},
): CurrentUserPayload {
  return {
    id: ACTOR_ID,
    email: 'seller@nbos.test',
    role: 'custom',
    roleLevel: 4,
    departmentIds: OWN_ACTOR.departmentIds,
    firstName: 'Ada',
    lastName: 'Seller',
    permissions,
    ...overrides,
  };
}

const SELLER_PERMS = {
  CRM_LEADS_VIEW: 'OWN',
  CRM_DEALS_VIEW: 'OWN',
  ...PLAY,
  DRIVE_VIEW: 'OWN',
};
const MARKETING_DEFAULT_PERMS = {
  CRM_LEADS_VIEW: 'ALL',
  CRM_DEALS_VIEW: 'OWN',
  DRIVE_VIEW: 'OWN',
};
const LEADER_PERMS = {
  CRM_LEADS_VIEW: 'ALL',
  CRM_DEALS_VIEW: 'ALL',
  ...PLAY,
  DRIVE_VIEW: 'ALL',
};

describe('CallsRecordingService', () => {
  const send = vi.fn();
  const r2 = { bucket: 'recordings', ensureS3: vi.fn(() => ({ send })) };
  const driveAccess = { fromRequest: vi.fn() };
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: CallsRecordingService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    r2.ensureS3.mockReturnValue({ send });
    driveAccess.fromRequest.mockResolvedValue({
      employeeId: ACTOR_ID,
      departmentIds: OWN_ACTOR.departmentIds,
      driveScope: 'OWN',
    });
    findAccessible.mockResolvedValue({
      storageKey: 'calls/rec.ogg',
      mimeType: 'audio/ogg',
      sizeBytes: 5n,
    });
    send.mockResolvedValue({ Body: Readable.from(['audio']), ContentLength: 5 });
    service = new CallsRecordingService(
      prisma as never,
      r2 as never,
      new CallAccessPolicyService(prisma as never),
      driveAccess as never,
    );
  });

  function allowView(): void {
    prisma.atsCallEvent.findUnique.mockResolvedValue(READY_CALL);
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: READY_CALL.id });
  }

  function denyViewKnownCall(): void {
    prisma.atsCallEvent.findUnique.mockResolvedValue({ id: READY_CALL.id });
    prisma.atsCallEvent.findFirst.mockResolvedValue(null);
  }

  function expectNoFileOrR2(): void {
    expect(findAccessible).not.toHaveBeenCalled();
    expect(driveAccess.fromRequest).not.toHaveBeenCalled();
    expect(r2.ensureS3).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  }

  it('allows playback when Call view, PLAY, and confidential file access pass', async () => {
    allowView();
    const result = await service.streamRecording('call-1', playbackUser(SELLER_PERMS));
    expect(result.kind).toBe('stream');
    expect(result.kind === 'stream' && result.file instanceof StreamableFile).toBe(true);
    expect(findAccessible).toHaveBeenCalledWith(
      prisma,
      'file-1',
      expect.objectContaining({ employeeId: ACTOR_ID, driveScope: 'OWN' }),
    );
    expect(r2.ensureS3).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectCommand);
  });

  it('serves stored octet-stream recordings as audio/mpeg so the player can read duration', async () => {
    allowView();
    findAccessible.mockResolvedValue({
      storageKey: 'calls/rec.wav',
      mimeType: 'application/octet-stream',
      sizeBytes: 5n,
    });
    const result = await service.streamRecording('call-1', playbackUser(SELLER_PERMS));
    expect(result.kind).toBe('stream');
    if (result.kind !== 'stream') return;
    expect(result.headers['Content-Type']).toBe('audio/mpeg');
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(GetObjectCommand);
    expect((send.mock.calls[0]?.[0] as GetObjectCommand).input.Range).toBeUndefined();
  });

  it('denies when the actor can see the Call but PLAY is missing', async () => {
    allowView();
    await expect(
      service.streamRecording(
        'call-1',
        playbackUser({ CRM_LEADS_VIEW: 'OWN', CRM_DEALS_VIEW: 'OWN', DRIVE_VIEW: 'OWN' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expectNoFileOrR2();
  });

  it('denies when PLAY is present but the actor cannot see the Call', async () => {
    denyViewKnownCall();
    await expect(
      service.streamRecording('call-1', playbackUser(SELLER_PERMS)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expectNoFileOrR2();
  });

  it('denies when Drive FileAsset policy rejects the CONFIDENTIAL recording', async () => {
    allowView();
    findAccessible.mockResolvedValue(null);
    await expect(
      service.streamRecording('call-1', playbackUser(SELLER_PERMS)),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(r2.ensureS3).not.toHaveBeenCalled();
  });

  it('denies Marketing default permissions', async () => {
    allowView();
    await expect(
      service.streamRecording(
        'call-1',
        playbackUser(MARKETING_DEFAULT_PERMS, { role: 'marketing' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expectNoFileOrR2();
  });

  it('denies a custom role without PLAY', async () => {
    allowView();
    await expect(
      service.streamRecording(
        'call-1',
        playbackUser({ CRM_LEADS_VIEW: 'OWN', DRIVE_VIEW: 'OWN' }, { role: 'ops-custom' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expectNoFileOrR2();
  });

  it('allows a custom role with PLAY plus object and file access', async () => {
    allowView();
    const result = await service.streamRecording(
      'call-1',
      playbackUser(SELLER_PERMS, { role: 'ops-custom' }),
    );
    expect(result.kind).toBe('stream');
    expect(result.kind === 'stream' && result.file instanceof StreamableFile).toBe(true);
    expect(r2.ensureS3).toHaveBeenCalledTimes(1);
  });

  it('allows a Seller with PLAY on their own Call', async () => {
    allowView();
    await expect(
      service.streamRecording('call-1', playbackUser(SELLER_PERMS, { role: 'seller' })),
    ).resolves.toMatchObject({ kind: 'stream' });
  });

  it('denies a Seller with PLAY on another employee Call', async () => {
    denyViewKnownCall();
    await expect(
      service.streamRecording('call-1', playbackUser(SELLER_PERMS, { role: 'seller' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expectNoFileOrR2();
  });

  it.each([['head-sales'], ['ceo'], ['owner']] as const)(
    'allows default %s playback when object and file access pass',
    async (role) => {
      allowView();
      await expect(
        service.streamRecording('call-1', playbackUser(LEADER_PERMS, { role })),
      ).resolves.toMatchObject({ kind: 'stream' });
      expect(r2.ensureS3).toHaveBeenCalledTimes(1);
    },
  );

  it('does not stream when recordingStatus is not READY', async () => {
    prisma.atsCallEvent.findUnique
      .mockResolvedValueOnce({ id: READY_CALL.id })
      .mockResolvedValueOnce({ ...READY_CALL, recordingStatus: 'PENDING' });
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: READY_CALL.id });
    await expect(
      service.streamRecording('call-1', playbackUser(SELLER_PERMS)),
    ).rejects.toBeInstanceOf(NotFoundException);
    expectNoFileOrR2();
  });

  it('does not stream when recordingFileAssetId is missing', async () => {
    prisma.atsCallEvent.findUnique
      .mockResolvedValueOnce({ id: READY_CALL.id })
      .mockResolvedValueOnce({ ...READY_CALL, recordingFileAssetId: null });
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: READY_CALL.id });
    await expect(
      service.streamRecording('call-1', playbackUser(SELLER_PERMS)),
    ).rejects.toBeInstanceOf(NotFoundException);
    expectNoFileOrR2();
  });

  it('does not stream when the FileAsset is missing', async () => {
    allowView();
    findAccessible.mockResolvedValue(null);
    await expect(service.streamRecording('call-1', playbackUser(SELLER_PERMS))).rejects.toThrow(
      NotFoundException,
    );
    expect(r2.ensureS3).not.toHaveBeenCalled();
  });

  it('calls R2 GetObject only after view, PLAY, READY, and Drive checks', async () => {
    allowView();
    await service.streamRecording('call-1', playbackUser(SELLER_PERMS));
    const viewOrder = prisma.atsCallEvent.findFirst.mock.invocationCallOrder[0] ?? 0;
    const fileOrder = findAccessible.mock.invocationCallOrder[0] ?? 0;
    const r2Order = r2.ensureS3.mock.invocationCallOrder[0] ?? 0;
    expect(viewOrder).toBeLessThan(fileOrder);
    expect(fileOrder).toBeLessThan(r2Order);
    expect(driveAccess.fromRequest).toHaveBeenCalled();
  });
});
