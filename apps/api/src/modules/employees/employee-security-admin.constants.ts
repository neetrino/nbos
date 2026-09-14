/** Owner-initiated account security actions on another employee (My Company → Team → Security). */

export const SECURITY_ADMIN_SELF_TARGET_MESSAGE =
  'Use your own Security tab to change your password or sign out your devices.';

export const PASSWORD_RESET_LINK_AUDIT_ACTION = 'employee.password_reset_link_sent';
export const SESSIONS_REVOKED_AUDIT_ACTION = 'employee.sessions_revoked';

export const PASSWORD_RESET_LINK_NOTIFICATION_TYPE = 'employee.security.password_reset_link_sent';
export const SESSIONS_REVOKED_NOTIFICATION_TYPE = 'employee.security.sessions_revoked';

export const SECURITY_ADMIN_SOURCE_MODULE = 'employees';

export const PASSWORD_RESET_LINK_NOTIFICATION_TITLE = 'Password reset link sent';
export const PASSWORD_RESET_LINK_NOTIFICATION_BODY =
  'The platform owner started a password reset for your account. Check your email — the link expires within the hour.';

export const SESSIONS_REVOKED_NOTIFICATION_TITLE = 'You were signed out on all devices';
export const SESSIONS_REVOKED_NOTIFICATION_BODY =
  'The platform owner ended all active sessions for your account. Sign in again to continue.';
