const PERSISTED_SECRET_KEYS = ['apiKey', 'encryptedApiKey', 'secretHash'] as const;

/**
 * Walks an HTTP payload and reports persisted secret field names.
 * `token` is allowed only on issue/rotate responses and is checked separately.
 */
export function findPersistedSecretFields(value: unknown, path = '$'): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findPersistedSecretFields(item, `${path}[${index}]`));
  }
  if (typeof value !== 'object') {
    return [];
  }
  const record = value as Record<string, unknown>;
  const hits: string[] = [];
  for (const key of Object.keys(record)) {
    const next = `${path}.${key}`;
    if ((PERSISTED_SECRET_KEYS as readonly string[]).includes(key)) {
      hits.push(next);
    }
    hits.push(...findPersistedSecretFields(record[key], next));
  }
  return hits;
}

export function findRawTokenFields(value: unknown, path = '$'): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findRawTokenFields(item, `${path}[${index}]`));
  }
  if (typeof value !== 'object') {
    return [];
  }
  const record = value as Record<string, unknown>;
  const hits: string[] = [];
  for (const key of Object.keys(record)) {
    const next = `${path}.${key}`;
    if (key === 'token') {
      hits.push(next);
    }
    hits.push(...findRawTokenFields(record[key], next));
  }
  return hits;
}
