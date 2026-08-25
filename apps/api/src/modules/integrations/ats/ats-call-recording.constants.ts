/** ATS.am call recording download queue (NBOS Drive FileAsset). */

export const ATS_CALL_RECORDING_QUEUE_NAME = 'ats-call-recording';
export const ATS_CALL_RECORDING_DOWNLOAD_JOB_NAME = 'ats-call-recording-download';
export const ATS_CALL_RECORDING_REPROCESS_JOB_NAME = 'ats-call-recording-reprocess';

export const ATS_CALL_RECORD_ENDPOINT = 'https://account.ats.am/docs/api/v1/call-record';
export const ATS_CALL_RECORD_TIMEOUT_MS = 60_000;
export const ATS_CALL_RECORDING_MAX_BYTES = 500 * 1024 * 1024;
export const ATS_CALL_RECORDING_JOB_ATTEMPTS = 5;

export const ATS_CALL_RECORDING_SOURCE_MODULE = 'ats';
export const ATS_CALL_RECORDING_FILE_LINK_TYPE = 'ATTACHMENT' as const;
export const ATS_CALL_RECORDING_ENTITY_CALL = 'CALL';

export const ATS_NO_ANSWER_DISPOSITIONS = new Set(['NO ANSWER', 'NOANSWER']);

export const ATS_CALL_RECORDING_DEFAULT_MIME = 'audio/wav';
export const ATS_CALL_RECORDING_DEFAULT_EXT = '.wav';

export interface AtsCallRecordingJobPayload {
  callId: string;
  uid: string;
}
