/** Optional ATS webhook field: `undefined` = absent (do not change). `null` = explicit empty. */

export function isWebhookFieldPresent(value: string | null | undefined): value is string | null {
  return value !== undefined;
}

export function presentWebhookString(value: string | null | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
