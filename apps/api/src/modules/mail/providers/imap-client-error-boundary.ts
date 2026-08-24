import type { ImapFlow } from 'imapflow';

type ImapErrorWithCode = Error & { code?: string };

export type ImapClientErrorBoundary = {
  run: <T>(operation: Promise<T>) => Promise<T>;
};

/**
 * ImapFlow reports established-socket failures through EventEmitter `error` events.
 * A try/catch around connect/fetch/idle is therefore not sufficient: a late event
 * without a listener terminates Node. Keep this listener for the client's lifetime
 * and race active work so the event becomes an ordinary rejected operation.
 */
export function attachImapClientErrorBoundary(
  client: Pick<ImapFlow, 'on' | 'close'>,
  options: {
    onError: (detail: string) => void;
    sensitiveValues?: readonly string[];
  },
): ImapClientErrorBoundary {
  let eventError: ImapErrorWithCode | null = null;
  let rejectEvent: (error: ImapErrorWithCode) => void = () => undefined;
  const eventFailure = new Promise<never>((_resolve, reject) => {
    rejectEvent = reject;
  });

  // The boundary must also be safe when an error arrives after the last operation.
  void eventFailure.catch(() => undefined);

  client.on('error', (caught: unknown) => {
    if (eventError) return;
    eventError = toControlledImapError(caught, options.sensitiveValues ?? []);
    try {
      options.onError(formatImapClientError(eventError));
    } catch {
      // An observability callback must never recreate the EventEmitter crash path.
    }
    try {
      client.close();
    } catch {
      // The socket may already be destroyed by ImapFlow before it emits `error`.
    }
    rejectEvent(eventError);
  });

  return {
    run: async <T>(operation: Promise<T>): Promise<T> => {
      if (eventError) throw eventError;
      return Promise.race([operation, eventFailure]);
    },
  };
}

export function formatImapClientError(error: unknown): string {
  const normalized = toControlledImapError(error, []);
  return `code=${normalized.code ?? 'UNKNOWN'} message=${normalized.message}`;
}

function toControlledImapError(
  caught: unknown,
  sensitiveValues: readonly string[],
): ImapErrorWithCode {
  const original = caught instanceof Error ? caught : new Error(String(caught));
  const code = readErrorCode(caught);
  const message = redactSensitiveText(original.message || 'IMAP client error', sensitiveValues);
  const controlled = new Error(message, { cause: original }) as ImapErrorWithCode;
  controlled.name = original.name || 'Error';
  if (code) controlled.code = code;
  return controlled;
}

function readErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return code === undefined || code === null ? undefined : String(code);
}

function redactSensitiveText(text: string, sensitiveValues: readonly string[]): string {
  let safe = text
    .replace(/\b(?:imap|imaps|smtp|smtps):\/\/\S+/gi, '[redacted-url]')
    .replace(/\b(password|pass|token|authorization)\s*[=:]\s*\S+/gi, '$1=[redacted]');
  for (const value of sensitiveValues) {
    if (value) safe = safe.split(value).join('[redacted]');
  }
  return safe;
}
