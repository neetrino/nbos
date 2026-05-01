/** User-facing labels for `MailDeliveryLogKind` API strings. */
export function formatMailDeliveryLogKind(kind: string): string {
  switch (kind) {
    case 'OUTBOUND_DRAFT_SAVED':
      return 'Draft saved';
    case 'OUTBOUND_QUEUED':
      return 'Queued for send';
    case 'OUTBOUND_SEND_STUB_FAILED':
      return 'Send attempt failed (stub)';
    case 'OUTBOUND_SEND_CANCELLED':
      return 'Send cancelled';
    case 'OUTBOUND_FAILED_RESET_TO_DRAFT':
      return 'Failed send reset to draft';
    default:
      return kind.replaceAll('_', ' ');
  }
}
