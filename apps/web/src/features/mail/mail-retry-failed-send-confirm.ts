import { mailApi } from '@/lib/api/mail';
import { MAIL_OUTCOME_UNKNOWN_COPY } from './mail-outbound-copy';

export const MAIL_RETRY_SEND_CONFIRM = 'Send this message again?';

/** Returns true when the user confirms retry after checking delivery logs. */
export async function confirmRetryFailedSend(
  threadId: string,
  messageId: string,
): Promise<boolean> {
  let message = MAIL_RETRY_SEND_CONFIRM;
  try {
    const logs = await mailApi.listMessageDeliveryLogs(threadId, messageId);
    if (logs.some((row) => row.kind === 'OUTCOME_UNKNOWN')) {
      message = MAIL_OUTCOME_UNKNOWN_COPY;
    }
  } catch {
    // Logs unavailable — still allow retry with the standard prompt.
  }
  return window.confirm(message);
}
