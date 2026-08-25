import { CopyObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma } from '../../../test-utils/mock-prisma';
import {
  AtsCallRecordingReprocessService,
  replaceNameExtension,
} from './ats-call-recording-reprocess.service';

const CALL_ID = 'call-1';
const MPEG_PREFIX = Buffer.from([0xff, 0xe3, 0x48, 0x64, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const READY_CALL = {
  id: CALL_ID,
  recordingStatus: 'READY',
  recordingFileAssetId: 'file-1',
};
const WAV_ASSET = {
  id: 'file-1',
  displayName: 'call-uid-recording.wav',
  originalName: 'call-uid-recording.wav',
  mimeType: 'application/octet-stream',
  storageKey: 'org/calls/call-uid-recording.wav',
  purpose: 'CALL_RECORDING',
};

describe('replaceNameExtension', () => {
  it('replaces a trailing extension', () => {
    expect(replaceNameExtension('call-1.wav', '.mp3')).toBe('call-1.mp3');
  });

  it('appends when the name has no extension', () => {
    expect(replaceNameExtension('recording', '.mp3')).toBe('recording.mp3');
    expect(replaceNameExtension('  ', '.mp3')).toBe('recording.mp3');
  });
});

describe('AtsCallRecordingReprocessService', () => {
  const send = vi.fn();
  const r2 = { bucket: 'recordings', ensureS3: vi.fn(() => ({ send })) };
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: AtsCallRecordingReprocessService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    r2.ensureS3.mockReturnValue({ send });
    prisma.atsCallEvent.findUnique.mockResolvedValue(READY_CALL);
    prisma.fileAsset.findFirst.mockResolvedValue(WAV_ASSET);
    send.mockImplementation((command: object) => {
      if (command instanceof GetObjectCommand) {
        return Promise.resolve({ Body: Readable.from([MPEG_PREFIX]) });
      }
      return Promise.resolve({});
    });
    service = new AtsCallRecordingReprocessService(prisma as never, r2 as never);
  });

  it('skips when the call is not READY', async () => {
    prisma.atsCallEvent.findUnique.mockResolvedValue({
      ...READY_CALL,
      recordingStatus: 'PENDING',
    });
    await expect(service.repairStoredRecording(CALL_ID)).resolves.toEqual({
      status: 'skipped',
      reason: 'not_ready',
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('skips unrecognized media without writing', async () => {
    send.mockImplementation((command: object) => {
      if (command instanceof GetObjectCommand) {
        return Promise.resolve({ Body: Readable.from([Buffer.from('xxxx')]) });
      }
      return Promise.resolve({});
    });
    await expect(service.repairStoredRecording(CALL_ID)).resolves.toEqual({
      status: 'skipped',
      reason: 'unrecognized_media',
    });
    expect(prisma.fileAsset.update).not.toHaveBeenCalled();
    expect(send.mock.calls.some(([command]) => command instanceof CopyObjectCommand)).toBe(false);
  });

  it('skips when mime and display name are already current', async () => {
    prisma.fileAsset.findFirst.mockResolvedValue({
      ...WAV_ASSET,
      mimeType: 'audio/mpeg',
      displayName: 'call-uid-recording.mp3',
      originalName: 'call-uid-recording.mp3',
    });
    await expect(service.repairStoredRecording(CALL_ID)).resolves.toEqual({
      status: 'skipped',
      reason: 'already_current',
    });
    expect(prisma.fileAsset.update).not.toHaveBeenCalled();
    expect(send.mock.calls.some(([command]) => command instanceof CopyObjectCommand)).toBe(false);
  });

  it('repairs octet-stream MPEG as audio/mpeg before updating FileAsset', async () => {
    const result = await service.repairStoredRecording(CALL_ID);
    expect(result).toEqual({ status: 'repaired', mimeType: 'audio/mpeg' });
    const copy = send.mock.calls.find(([command]) => command instanceof CopyObjectCommand)?.[0] as
      | CopyObjectCommand
      | undefined;
    expect(copy?.input.ContentType).toBe('audio/mpeg');
    expect(copy?.input.MetadataDirective).toBe('REPLACE');
    expect(copy?.input.CopySource).toBe(`recordings/${encodeURIComponent(WAV_ASSET.storageKey)}`);
    expect(prisma.fileAsset.update).toHaveBeenCalledWith({
      where: { id: 'file-1' },
      data: {
        mimeType: 'audio/mpeg',
        displayName: 'call-uid-recording.mp3',
        originalName: 'call-uid-recording.mp3',
      },
    });
    const copyIndex = send.mock.calls.findIndex(
      ([command]) => command instanceof CopyObjectCommand,
    );
    const copyOrder = send.mock.invocationCallOrder[copyIndex];
    const updateOrder = prisma.fileAsset.update.mock.invocationCallOrder[0];
    expect(copyOrder).toBeDefined();
    expect(copyOrder ?? 0).toBeLessThan(updateOrder ?? 0);
  });

  it('does not update FileAsset when CopyObject fails', async () => {
    send.mockImplementation((command: object) => {
      if (command instanceof GetObjectCommand) {
        return Promise.resolve({ Body: Readable.from([MPEG_PREFIX]) });
      }
      return Promise.reject(new Error('copy failed'));
    });
    await expect(service.repairStoredRecording(CALL_ID)).rejects.toThrow('copy failed');
    expect(prisma.fileAsset.update).not.toHaveBeenCalled();
  });
});
