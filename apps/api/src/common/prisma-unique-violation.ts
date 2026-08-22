/** Prisma unique-constraint violation (P2002). Do not treat other Prisma codes as success. */

export function isPrismaUniqueViolation(
  error: unknown,
  expectedFields: readonly string[],
): boolean {
  if (!isRecord(error) || error.code !== 'P2002') {
    return false;
  }
  const names = uniqueTargetNames(error);
  if (names.length === 0) {
    return false;
  }
  return expectedFields.every((field) => names.some((name) => targetIncludesField(name, field)));
}

function uniqueTargetNames(error: Record<string, unknown>): string[] {
  const meta = isRecord(error.meta) ? error.meta : null;
  const target = meta?.target;
  if (Array.isArray(target)) {
    return target.map(String);
  }
  if (typeof target === 'string' && target.trim()) {
    return [target];
  }
  return [];
}

function targetIncludesField(name: string, field: string): boolean {
  if (name === field) return true;
  const snake = toSnakeCase(field);
  if (name === snake) return true;
  return name.includes(field) || (snake !== field && name.includes(snake));
}

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
