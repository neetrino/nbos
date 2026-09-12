import type { AbstractIntlMessages } from 'next-intl';

/** Nested partial overlay — missing keys keep the English fallback. */
export type MessageOverlay<T> = T extends string
  ? T
  : T extends AbstractIntlMessages
    ? { readonly [K in keyof T]?: MessageOverlay<T[K]> }
    : never;

type LooseMessageOverlay = {
  readonly [key: string]: string | LooseMessageOverlay | undefined;
};

export function mergeMessages<T extends AbstractIntlMessages>(
  fallback: T,
  overlay: MessageOverlay<T>,
): T {
  return mergeRecord(fallback, overlay) as T;
}

function mergeRecord(
  fallback: AbstractIntlMessages,
  overlay: LooseMessageOverlay,
): AbstractIntlMessages {
  const result: AbstractIntlMessages = { ...fallback };
  for (const [key, overlayValue] of Object.entries(overlay)) {
    if (overlayValue === undefined) {
      continue;
    }
    const current = result[key];
    if (isMessageRecord(current) && isMessageRecord(overlayValue)) {
      result[key] = mergeRecord(current, overlayValue);
      continue;
    }
    if (typeof overlayValue === 'string') {
      result[key] = overlayValue;
    }
  }
  return result;
}

function isMessageRecord(value: unknown): value is AbstractIntlMessages & LooseMessageOverlay {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
