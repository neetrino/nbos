/** Shared account-password policy for invite + change-password. */
export const ACCOUNT_PASSWORD_MIN_LENGTH = 10;
export const ACCOUNT_PASSWORD_MAX_LENGTH = 128;
/** At least one letter and one digit. */
export const ACCOUNT_PASSWORD_COMPLEXITY = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const ACCOUNT_PASSWORD_COMPLEXITY_MESSAGE =
  'password must contain at least one letter and one number';
