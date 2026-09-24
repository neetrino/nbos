export interface MailCounterpartRecipient {
  kind: string;
  email: string;
  displayName: string | null;
}

export interface MailCounterpartMessage {
  direction: string;
  recipients: MailCounterpartRecipient[];
}

export interface MailThreadCounterpart {
  email: string | null;
  displayName: string | null;
}

/**
 * Resolves the external party for a thread list row from the latest message:
 * inbound → From; outbound → first To.
 */
export function resolveMailThreadCounterpart(
  message: MailCounterpartMessage | null | undefined,
): MailThreadCounterpart {
  if (!message) {
    return { email: null, displayName: null };
  }
  if (message.direction === 'INBOUND') {
    const from = message.recipients.find((row) => row.kind === 'FROM');
    return { email: from?.email ?? null, displayName: from?.displayName ?? null };
  }
  const to = message.recipients.find((row) => row.kind === 'TO');
  return { email: to?.email ?? null, displayName: to?.displayName ?? null };
}
