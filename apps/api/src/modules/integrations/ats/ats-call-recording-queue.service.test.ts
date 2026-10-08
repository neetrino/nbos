import { describe, expect, it, vi } from 'vitest';
import {
  ATS_CALL_RECORDING_DOWNLOAD_JOB_NAME,
  ATS_CALL_RECORDING_JOB_ATTEMPTS,
  ATS_CALL_RECORDING_REPROCESS_JOB_NAME,
  ATS_CALL_RECORDING_RETRY_DELAY_MS,
} from './ats-call-recording.constants';
import { atsCallRecordingJobId, atsCallRecordingReprocessJobId } from './ats-call-recording-job-id';
import { AtsCallRecordingQueueService } from './ats-call-recording-queue.service';

const PAYLOAD = { callId: 'call-1', uid: 'uid-1' };

function serviceWith(queue: {
  add: ReturnType<typeof vi.fn>;
  getJob: ReturnType<typeof vi.fn>;
}): AtsCallRecordingQueueService {
  const service = new AtsCallRecordingQueueService();
  (service as unknown as { queue: typeof queue }).queue = queue;
  return service;
}

describe('AtsCallRecordingQueueService', () => {
  it('enqueues a download with three attempts and a fixed 60s retry', async () => {
    const add = vi.fn().mockResolvedValue({});
    const service = serviceWith({ add, getJob: vi.fn().mockResolvedValue(null) });

    await expect(service.enqueueDownload(PAYLOAD)).resolves.toBe(true);

    expect(add).toHaveBeenCalledWith(ATS_CALL_RECORDING_DOWNLOAD_JOB_NAME, PAYLOAD, {
      jobId: atsCallRecordingJobId(PAYLOAD.callId),
      attempts: ATS_CALL_RECORDING_JOB_ATTEMPTS,
      backoff: { type: 'fixed', delay: ATS_CALL_RECORDING_RETRY_DELAY_MS },
    });
    expect(ATS_CALL_RECORDING_JOB_ATTEMPTS).toBe(3);
    expect(ATS_CALL_RECORDING_RETRY_DELAY_MS).toBe(60_000);
  });

  it('does not enqueue a second download while the same call is already queued', async () => {
    const add = vi.fn();
    const existing = { getState: vi.fn().mockResolvedValue('delayed') };
    const service = serviceWith({ add, getJob: vi.fn().mockResolvedValue(existing) });

    await expect(service.enqueueDownload(PAYLOAD)).resolves.toBe(true);
    expect(add).not.toHaveBeenCalled();
  });

  it('leaves reprocess jobs on the queue default retry policy', async () => {
    const add = vi.fn().mockResolvedValue({});
    const service = serviceWith({ add, getJob: vi.fn().mockResolvedValue(null) });

    await expect(service.enqueueReprocess(PAYLOAD)).resolves.toBe(true);
    expect(add).toHaveBeenCalledWith(ATS_CALL_RECORDING_REPROCESS_JOB_NAME, PAYLOAD, {
      jobId: atsCallRecordingReprocessJobId(PAYLOAD.callId),
    });
  });
});
