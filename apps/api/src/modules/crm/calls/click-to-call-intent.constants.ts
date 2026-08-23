export const ATS_CALL_INTENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  ACCEPTED: 'ACCEPTED',
  FAILED: 'FAILED',
} as const;

export type AtsCallIntentStatus =
  (typeof ATS_CALL_INTENT_STATUS)[keyof typeof ATS_CALL_INTENT_STATUS];

export const ATS_CALL_INTENT_UNIQUE_FIELDS = ['employeeId', 'idempotencyKey'] as const;
