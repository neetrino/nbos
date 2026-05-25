/**
 * Prisma returns `BigInt` for some numeric columns; `JSON.stringify` throws.
 * Normalize nested values before sending FileAsset payloads over HTTP.
 */
export function jsonSafeForHttp<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === 'bigint') {
        return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : v.toString();
      }
      return v;
    }),
  ) as T;
}
