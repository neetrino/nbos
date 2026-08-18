-- Slice A: outbound send contour (QUEUED → SENDING → SENT/FAILED) + ambiguous outcome log.

ALTER TYPE "EmailDeliveryStatus" ADD VALUE IF NOT EXISTS 'SENDING';
ALTER TYPE "MailDeliveryLogKind" ADD VALUE IF NOT EXISTS 'OUTCOME_UNKNOWN';
