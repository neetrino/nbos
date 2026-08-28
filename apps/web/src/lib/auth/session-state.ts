/** Reserved BFF response header. Backend responses are never allowed to set it. */
export const SESSION_INVALID_HEADER = 'x-nbos-session-invalid';
export const SESSION_INVALID_VALUE = '1';

export function hasInvalidSessionHeader(headers: unknown): boolean {
  if (!headers || typeof headers !== 'object') return false;

  const candidate = headers as {
    get?: (name: string) => unknown;
    [SESSION_INVALID_HEADER]?: unknown;
  };
  const value =
    typeof candidate.get === 'function'
      ? candidate.get(SESSION_INVALID_HEADER)
      : candidate[SESSION_INVALID_HEADER];

  return value === SESSION_INVALID_VALUE;
}

export function shouldSignOutForResponse(status: number | undefined, headers: unknown): boolean {
  return status === 401 && hasInvalidSessionHeader(headers);
}
