import { describe, expect, it } from 'vitest';
import { ATS_CALL_RECORDING_JOB_ATTEMPTS } from './ats-call-recording.constants';
import {
  atsCallRecordingJobId,
  atsCallRecordingReprocessJobId,
  isLastRecordingAttempt,
} from './ats-call-recording-job-id';

describe('ats call recording job ids', () => {
  it('keeps download and reprocess job ids distinct for the same call', () => {
    const callId = '9af03063-4cf4-4f77-a925-1627f4b7849f';
    expect(atsCallRecordingReprocessJobId(callId)).not.toBe(atsCallRecordingJobId(callId));
  });

  it('treats only the third download attempt as final', () => {
    expect(isLastRecordingAttempt(0, ATS_CALL_RECORDING_JOB_ATTEMPTS)).toBe(false);
    expect(isLastRecordingAttempt(1, ATS_CALL_RECORDING_JOB_ATTEMPTS)).toBe(false);
    expect(isLastRecordingAttempt(2, ATS_CALL_RECORDING_JOB_ATTEMPTS)).toBe(true);
  });
});
