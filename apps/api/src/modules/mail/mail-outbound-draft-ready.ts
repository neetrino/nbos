/** Queue/send is blocked until the draft has a To address and a subject. */
export function outboundDraftSendBlocker(params: {
  subject: string;
  recipients: ReadonlyArray<{ kind: string }>;
}): string | null {
  const hasTo = params.recipients.some((row) => row.kind === 'TO');
  if (!hasTo) {
    return 'Add at least one To address before sending.';
  }
  if (params.subject.trim().length === 0) {
    return 'Add a subject before sending.';
  }
  return null;
}
