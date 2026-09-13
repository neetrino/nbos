export {
  DEFAULT_INTERFACE_LOCALE,
  RESERVED_INTERFACE_LOCALES,
  WRITABLE_INTERFACE_LOCALES,
  isKnownInterfaceLocale,
  isWritableInterfaceLocale,
  parseKnownInterfaceLocale,
  parseWritableInterfaceLocale,
} from './locales';
export type {
  InterfaceLocalePreference,
  KnownInterfaceLocale,
  ReservedInterfaceLocale,
  WritableInterfaceLocale,
} from './locales';
export {
  interpolateSystemCopy,
  invitationEmailCopy,
  passwordResetEmailCopy,
  reportExportEmailCopy,
} from './system-email-copy';
export type {
  InvitationEmailCopy,
  PasswordResetEmailCopy,
  ReportExportEmailCopy,
  SystemEmailLocale,
} from './system-email-copy';
