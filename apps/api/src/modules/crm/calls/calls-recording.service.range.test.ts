import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { NotFoundException, StreamableFile } from '@nestjs/common';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CRM_CALL_RECORDINGS_PLAY_PERMISSION } from '@nbos/shared';
import type { CurrentUserPayload } from '../../../common/decorators';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import { findAccessibleFileAssetStorage } from '../../drive/drive-accessible-file.op';
import { CallAccessPolicyService } from './call-access-policy.service';
import { ACTOR_ID, OWN_ACTOR } from './call-access.test-support';
import type { RecordingPlaybackResult } from './calls-recording-range';
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
const TOTAL = 34776;
const FILE = {
  storageKey: 'calls/rec.mp3',
  mimeType: 'application/octet-stream',
  sizeBytes: BigInt(TOTAL),
};
const PLAY_USER: CurrentUserPayload = {
  id: ACTOR_ID,
  email: 'seller@nbos.test',
  role: 'custom',
  roleLevel: 4,
  departmentIds: OWN_ACTOR.departmentIds,
  firstName: 'Ada',
  lastName: 'Seller',
  permissions: {
    CRM_LEADS_VIEW: 'OWN',
    CRM_DEALS_VIEW: 'OWN',
    [CRM_CALL_RECORDINGS_PLAY_PERMISSION]: 'ALL',
    DRIVE_VIEW: 'OWN',
  },
};

function expectStream(
  result: RecordingPlaybackResult,
  status: 200 | 206,
  headers: Record<string, string>,
): void {
  expect(result).toMatchObject({ kind: 'stream', status, headers });
  if (result.kind !== 'stream') return;
  expect(result.file).toBeInstanceOf(StreamableFile);
}

function lastGetObject(send: ReturnType<typeof vi.fn>): GetObjectCommand {
  for (let index = send.mock.calls.length - 1; index >= 0; index -= 1) {
    const command = send.mock.calls[index]?.[0];
    if (command instanceof GetObjectCommand) return command;
  }
  throw new Error('GetObjectCommand was not sent');
}

describe('CallsRecordingService byte-range streaming', () => {
  const send = vi.fn();
  const r2 = { bucket: 'recordings', ensureS3: vi.fn(() => ({ send })) };
  const driveAccess = { fromRequest: vi.fn() };
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: CallsRecordingService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    prisma.atsCallEvent.findUnique.mockResolvedValue(READY_CALL);
    prisma.atsCallEvent.findFirst.mockResolvedValue({ id: READY_CALL.id });
    r2.ensureS3.mockReturnValue({ send });
    driveAccess.fromRequest.mockResolvedValue({
      employeeId: ACTOR_ID,
      departmentIds: OWN_ACTOR.departmentIds,
      driveScope: 'OWN',
    });
    findAccessible.mockResolvedValue(FILE);
    send.mockResolvedValue({ Body: Readable.from(['audio']), ContentLength: TOTAL });
    service = new CallsRecordingService(
      prisma as never,
      r2 as never,
      new CallAccessPolicyService(prisma as never),
      driveAccess as never,
    );
  });

  it('returns 200 with length, accept-ranges, and inline disposition', async () => {
    const result = await service.streamRecording('call-1', PLAY_USER);
    expectStream(result, 200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(TOTAL),
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
    });
    expect(lastGetObject(send).input.Range).toBeUndefined();
  });

  it('streams an open-ended range as 206 and forwards it to R2', async () => {
    const result = await service.streamRecording('call-1', PLAY_USER, 'bytes=0-');
    expectStream(result, 206, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(TOTAL),
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes 0-${TOTAL - 1}/${TOTAL}`,
      'Content-Disposition': 'inline',
    });
    expect(lastGetObject(send).input.Range).toBe(`bytes=0-${TOTAL - 1}`);
  });

  it('streams a bounded range as 206', async () => {
    const result = await service.streamRecording('call-1', PLAY_USER, 'bytes=100-199');
    expectStream(result, 206, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': '100',
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes 100-199/${TOTAL}`,
      'Content-Disposition': 'inline',
    });
    expect(lastGetObject(send).input.Range).toBe('bytes=100-199');
  });

  it('streams a suffix range as 206', async () => {
    const result = await service.streamRecording('call-1', PLAY_USER, 'bytes=-500');
    expectStream(result, 206, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': '500',
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${TOTAL - 500}-${TOTAL - 1}/${TOTAL}`,
      'Content-Disposition': 'inline',
    });
    expect(lastGetObject(send).input.Range).toBe(`bytes=${TOTAL - 500}-${TOTAL - 1}`);
  });

  it('returns 416 without calling GetObject when the range is unsatisfiable', async () => {
    const result = await service.streamRecording('call-1', PLAY_USER, `bytes=${TOTAL}-`);
    expect(result).toEqual({ kind: 'unsatisfiable', totalSize: TOTAL });
    expect(send).not.toHaveBeenCalled();
  });

  it('returns 416 when R2 rejects a range as InvalidRange', async () => {
    send.mockRejectedValue({ name: 'InvalidRange', $metadata: { httpStatusCode: 416 } });
    const result = await service.streamRecording('call-1', PLAY_USER, 'bytes=0-10');
    expect(result).toEqual({ kind: 'unsatisfiable', totalSize: TOTAL });
  });

  it('heads R2 when FileAsset.sizeBytes is missing', async () => {
    findAccessible.mockResolvedValue({ ...FILE, sizeBytes: null });
    send.mockImplementation((command: object) => {
      if (command instanceof HeadObjectCommand) {
        return Promise.resolve({ ContentLength: TOTAL });
      }
      return Promise.resolve({ Body: Readable.from(['audio']), ContentLength: TOTAL });
    });
    const result = await service.streamRecording('call-1', PLAY_USER);
    expect(send.mock.calls[0]?.[0]).toBeInstanceOf(HeadObjectCommand);
    expectStream(result, 200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(TOTAL),
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
    });
  });

  it('prefers R2 ContentLength when it disagrees with the stored size', async () => {
    send.mockResolvedValue({ Body: Readable.from(['audio']), ContentLength: 5 });
    const result = await service.streamRecording('call-1', PLAY_USER);
    expectStream(result, 200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': '5',
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
    });
  });

  it('does not stream when size cannot be resolved', async () => {
    findAccessible.mockResolvedValue({ ...FILE, sizeBytes: 0n });
    send.mockImplementation((command: object) => {
      if (command instanceof HeadObjectCommand) {
        return Promise.resolve({ ContentLength: 0 });
      }
      return Promise.resolve({ Body: Readable.from(['audio']) });
    });
    await expect(service.streamRecording('call-1', PLAY_USER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(send.mock.calls.some((call) => call[0] instanceof GetObjectCommand)).toBe(false);
  });
});
