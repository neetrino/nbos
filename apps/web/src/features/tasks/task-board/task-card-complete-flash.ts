/** Hold the card in place, green, before it leaves the active board. */
export const TASK_CARD_COMPLETE_FLASH_MS = 1500;

export const TASK_CARD_COMPLETE_FLASH_CLASS =
  'border-emerald-400 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/50';

export function waitAtLeast(startedAtMs: number, minDurationMs: number): Promise<void> {
  const remainingMs = minDurationMs - (Date.now() - startedAtMs);
  if (remainingMs <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, remainingMs);
  });
}
