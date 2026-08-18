import { Logger } from '@nestjs/common';

export type JobLogFields = {
  queue: string;
  jobName: string;
  jobId: string | undefined;
  attempt: number;
  durationMs: number;
  status: 'completed' | 'failed';
  errorCode?: string;
  errorClass?: string;
  mailAccountId?: string;
  messageId?: string;
};

function optionalJobLogSuffix(fields: JobLogFields): string {
  const parts: string[] = [];
  if (fields.errorClass) {
    parts.push(`errorClass=${fields.errorClass}`);
  }
  if (fields.mailAccountId) {
    parts.push(`mailAccountId=${fields.mailAccountId}`);
  }
  if (fields.messageId) {
    parts.push(`messageId=${fields.messageId}`);
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

/** Structured job log — never pass bodies, tokens, or signed URLs. */
export function logBullmqJob(logger: Logger, fields: JobLogFields): void {
  const base = `queue=${fields.queue} jobName=${fields.jobName} jobId=${fields.jobId ?? 'unknown'} attempt=${fields.attempt} durationMs=${fields.durationMs} status=${fields.status}${optionalJobLogSuffix(fields)}`;
  if (fields.status === 'failed') {
    logger.error(`${base} errorCode=${fields.errorCode ?? 'unknown'}`);
    return;
  }
  logger.log(base);
}
