const DEPARTMENT_SLUG_MAX = 80;
const DEPARTMENT_SLUG_FALLBACK = 'department';
const SLUG_SUFFIX_START = 2;
const MAX_SLUG_ATTEMPTS = 10_000;

/** ASCII slug from a department name. Empty when the name has no letters or digits. */
export function slugFromDepartmentName(name: string): string {
  let slug = '';
  let pendingHyphen = false;
  for (const char of name.trim().toLowerCase()) {
    if (/[a-z0-9]/.test(char)) {
      if (pendingHyphen && slug.length > 0) slug += '-';
      slug += char;
      pendingHyphen = false;
      continue;
    }
    pendingHyphen = slug.length > 0;
  }
  return slug.slice(0, DEPARTMENT_SLUG_MAX);
}

/** Unique slug among departments that already exist. */
export function uniqueDepartmentSlug(name: string, takenSlugs: readonly string[]): string {
  const taken = new Set(takenSlugs);
  const root = slugFromDepartmentName(name) || DEPARTMENT_SLUG_FALLBACK;
  if (!taken.has(root)) return root.slice(0, DEPARTMENT_SLUG_MAX);

  for (
    let suffix = SLUG_SUFFIX_START;
    suffix < SLUG_SUFFIX_START + MAX_SLUG_ATTEMPTS;
    suffix += 1
  ) {
    const tail = `-${suffix}`;
    const candidate = `${root.slice(0, DEPARTMENT_SLUG_MAX - tail.length)}${tail}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root.slice(0, DEPARTMENT_SLUG_MAX - 6)}-extra`;
}
