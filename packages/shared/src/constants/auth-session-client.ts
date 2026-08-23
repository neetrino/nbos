export const AUTH_SESSION_CLIENT_KINDS = [
  'web',
  'mobile_work',
  'mobile_messenger',
  'mobile_vault',
] as const;

export type AuthSessionClientKindApi = (typeof AUTH_SESSION_CLIENT_KINDS)[number];

export const AUTH_SESSION_NATIVE_CLIENT_KINDS = [
  'mobile_work',
  'mobile_messenger',
  'mobile_vault',
] as const satisfies readonly AuthSessionClientKindApi[];

export function isAuthSessionClientKind(value: string): value is AuthSessionClientKindApi {
  return (AUTH_SESSION_CLIENT_KINDS as readonly string[]).includes(value);
}

export function isNativeAuthSessionClientKind(value: string): boolean {
  return (AUTH_SESSION_NATIVE_CLIENT_KINDS as readonly string[]).includes(value);
}
