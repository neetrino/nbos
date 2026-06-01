/** Extracts the origin from a Referer header, or null when missing/invalid. */
export function originFromReferer(referer: string | undefined): string | null {
  if (!referer?.trim()) {
    return null;
  }
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

/** Resolves the request origin from Origin or Referer (browser CSRF signal). */
export function resolveRequestOrigin(
  originHeader: string | undefined,
  refererHeader: string | undefined,
): string | null {
  if (originHeader?.trim()) {
    return originHeader.trim();
  }
  return originFromReferer(refererHeader);
}

/** True when the HTTP method can mutate server state. */
export function isMutatingHttpMethod(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
