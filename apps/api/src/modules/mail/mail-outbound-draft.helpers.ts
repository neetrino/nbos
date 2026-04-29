export function dedupeEmailsCaseInsensitive(emails: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of emails) {
    const e = raw.trim();
    if (e.length === 0) continue;
    const key = e.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

export function buildOutboundDraftRecipients(
  messageId: string,
  account: { emailAddress: string; displayName: string | null },
  toList: string[],
  ccList: string[],
): Array<{
  messageId: string;
  kind: 'FROM' | 'TO' | 'CC';
  email: string;
  displayName: string | null;
}> {
  const rows: Array<{
    messageId: string;
    kind: 'FROM' | 'TO' | 'CC';
    email: string;
    displayName: string | null;
  }> = [
    {
      messageId,
      kind: 'FROM',
      email: account.emailAddress,
      displayName: account.displayName,
    },
  ];
  for (const email of toList) {
    rows.push({ messageId, kind: 'TO', email, displayName: null });
  }
  for (const email of ccList) {
    rows.push({ messageId, kind: 'CC', email, displayName: null });
  }
  return rows;
}
