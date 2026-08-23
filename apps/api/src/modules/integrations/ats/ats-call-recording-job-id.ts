import { toBullMqSafeJobId } from '@nbos/shared';
import {
  ATS_CALL_RECORDING_DOWNLOAD_JOB_NAME,
  ATS_CALL_RECORDING_JOB_ATTEMPTS,
} from './ats-call-recording.constants';

export function atsCallRecordingJobId(callId: string): string {
  return toBullMqSafeJobId(`${ATS_CALL_RECORDING_DOWNLOAD_JOB_NAME}:${callId}`);
}

export function isLastRecordingAttempt(attemptsMade: number, maxAttempts?: number): boolean {
  const budget = maxAttempts && maxAttempts > 0 ? maxAttempts : ATS_CALL_RECORDING_JOB_ATTEMPTS;
  return attemptsMade + 1 >= budget;
}
