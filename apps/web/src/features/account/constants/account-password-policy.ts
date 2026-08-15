/** Mirrors apps/api auth-password.policy (invite + change-password). */
export const ACCOUNT_PASSWORD_MIN_LENGTH = 10;
export const ACCOUNT_PASSWORD_MAX_LENGTH = 128;
export const ACCOUNT_PASSWORD_COMPLEXITY = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export const ACCOUNT_PASSWORD_HINT =
  'At least 10 characters, with at least one letter and one number.';
