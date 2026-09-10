export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

export function clonePlainJson(value: unknown): unknown | undefined {
  if (!isPlainJsonValue(value, new Set<object>())) return undefined;
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function isPlainJsonValue(value: unknown, seen: Set<object>): boolean {
  if (value === null) return true;
  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'boolean') return true;
  if (valueType === 'number') return Number.isFinite(value);
  if (valueType !== 'object') return false;
  const objectValue = value as object;
  if (seen.has(objectValue)) return false;
  seen.add(objectValue);
  if (Array.isArray(value)) {
    return value.every((item) => isPlainJsonValue(item, seen));
  }
  if (!isPlainRecord(value)) return false;
  return Object.keys(value).every((key) => isPlainJsonValue(value[key], seen));
}
