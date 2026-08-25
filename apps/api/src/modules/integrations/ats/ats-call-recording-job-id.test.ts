import { describe, expect, it } from 'vitest';
import { atsCallRecordingJobId, atsCallRecordingReprocessJobId } from './ats-call-recording-job-id';

describe('ats call recording job ids', () => {
  it('keeps download and reprocess job ids distinct for the same call', () => {
    const callId = '9af03063-4cf4-4f77-a925-1627f4b7849f';
    expect(atsCallRecordingReprocessJobId(callId)).not.toBe(atsCallRecordingJobId(callId));
  });
});
