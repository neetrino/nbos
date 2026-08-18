function readErrorField(error: unknown, key: string): string {
  if (typeof error !== 'object' || error === null || !(key in error)) {
    return '';
  }
  const value = (error as Record<string, unknown>)[key];
  return value === undefined || value === null ? '' : String(value);
}

function extractHttpStatus(error: unknown): number | undefined {
  const direct = Number(readErrorField(error, 'status') || readErrorField(error, 'code'));
  if (Number.isInteger(direct) && direct >= 100 && direct <= 599) {
    return direct;
  }
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: unknown } }).response;
    const nested = Number(response?.status);
    if (Number.isInteger(nested) && nested >= 100 && nested <= 599) {
      return nested;
    }
  }
  return undefined;
}

/** Gmail `history.list` is gone when historyId expired (404/410). */
export function isGmailHistoryGoneError(error: unknown): boolean {
  const status = extractHttpStatus(error);
  return status === 404 || status === 410;
}

/** Incremental history, or last-30 INBOX recovery when historyId is gone. */
export async function resolveGmailDeltaMessageIds(params: {
  historyId?: string | null;
  listHistory: (startHistoryId: string) => Promise<string[]>;
  listRecent: () => Promise<string[]>;
}): Promise<string[]> {
  if (!params.historyId) {
    return params.listRecent();
  }
  try {
    return await params.listHistory(params.historyId);
  } catch (error) {
    if (!isGmailHistoryGoneError(error)) {
      throw error;
    }
    return params.listRecent();
  }
}
