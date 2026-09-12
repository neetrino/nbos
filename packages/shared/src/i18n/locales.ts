export const DEFAULT_INTERFACE_LOCALE = 'en' as const;

/** Locales the employee may persist. `hy` is reserved and rejected on write. */
export const WRITABLE_INTERFACE_LOCALES = ['en', 'ru'] as const;

export const RESERVED_INTERFACE_LOCALES = ['hy'] as const;

export type WritableInterfaceLocale = (typeof WRITABLE_INTERFACE_LOCALES)[number];
export type ReservedInterfaceLocale = (typeof RESERVED_INTERFACE_LOCALES)[number];
export type KnownInterfaceLocale = WritableInterfaceLocale | ReservedInterfaceLocale;

export interface InterfaceLocalePreference {
  interfaceLocale: WritableInterfaceLocale;
}

export function isWritableInterfaceLocale(value: unknown): value is WritableInterfaceLocale {
  return (
    typeof value === 'string' && (WRITABLE_INTERFACE_LOCALES as readonly string[]).includes(value)
  );
}

/** Persisted or cookie values outside the writable allowlist become English. */
export function parseWritableInterfaceLocale(value: unknown): WritableInterfaceLocale {
  return isWritableInterfaceLocale(value) ? value : DEFAULT_INTERFACE_LOCALE;
}
