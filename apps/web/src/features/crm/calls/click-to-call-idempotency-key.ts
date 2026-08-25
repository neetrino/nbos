export type ClickToCallKeyStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const CLICK_TO_CALL_KEY_CHANGED_EVENT = 'nbos:click-to-call-key-changed';

export function clickToCallStorageKey(targetType: string, targetId: string): string {
  return `nbos.click-to-call:${targetType}:${targetId}`;
}

/** Reuse the UUID for retries of the same user action; a new click must call clear first. */
export function nextClickToCallIdempotencyKey(
  store: ClickToCallKeyStore,
  targetType: string,
  targetId: string,
  randomUUID: () => string,
): string {
  const storageKey = clickToCallStorageKey(targetType, targetId);
  const existing = store.getItem(storageKey);
  if (existing) return existing;
  const created = randomUUID();
  store.setItem(storageKey, created);
  notifyClickToCallKeyChanged(store);
  return created;
}

export function clearClickToCallIdempotencyKey(
  store: ClickToCallKeyStore,
  targetType: string,
  targetId: string,
): void {
  store.removeItem(clickToCallStorageKey(targetType, targetId));
  notifyClickToCallKeyChanged(store);
}

export function shouldKeepClickToCallIdempotencyKey(statusCode: number | undefined): boolean {
  if (statusCode == null) return true;
  if (statusCode === 202) return true;
  return statusCode >= 500;
}

export function hasStoredClickToCallIdempotencyKey(
  store: ClickToCallKeyStore,
  targetType: string,
  targetId: string,
): boolean {
  return Boolean(store.getItem(clickToCallStorageKey(targetType, targetId)));
}

export function subscribeClickToCallKeyChanges(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(CLICK_TO_CALL_KEY_CHANGED_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CLICK_TO_CALL_KEY_CHANGED_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export const CLICK_TO_CALL_NEW_CALL_WARNING =
  'The previous call may still be in progress. A new call may dial again. Continue?';

/** Clears the stored key after the user confirms a new conscious click. */
export function requestNewClickToCallKey(
  store: ClickToCallKeyStore,
  targetType: string,
  targetId: string,
  confirm: (message: string) => boolean,
): boolean {
  if (!confirm(CLICK_TO_CALL_NEW_CALL_WARNING)) return false;
  clearClickToCallIdempotencyKey(store, targetType, targetId);
  return true;
}

function notifyClickToCallKeyChanged(store: ClickToCallKeyStore): void {
  if (typeof window === 'undefined' || store !== window.sessionStorage) return;
  window.dispatchEvent(new Event(CLICK_TO_CALL_KEY_CHANGED_EVENT));
}
