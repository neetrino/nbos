export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_BYTES = 32;

export const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'If an account exists for this email, we sent a reset link.';

export const RESET_LINK_INVALID_MESSAGE = 'This reset link is invalid or has expired';

/** Admin-initiated reset only: the authenticated caller already sees the employee record. */
export const RESET_TARGET_TERMINATED_MESSAGE =
  'A terminated employee cannot receive a password reset link.';
export const RESET_TARGET_WITHOUT_PASSWORD_MESSAGE =
  'This employee has no password yet. Send an invitation instead.';
export const RESET_EMAIL_NOT_DELIVERED_MESSAGE =
  'The reset link could not be emailed. Check the email provider configuration and try again.';
