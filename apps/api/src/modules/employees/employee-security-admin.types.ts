/** Responses of owner-initiated employee security actions. Never carries a token or a reset URL. */

export interface EmployeePasswordResetLinkResult {
  employeeId: string;
  /** Mailbox the link was sent to; visible to the caller through the employee record anyway. */
  sentToEmail: string;
  expiresAt: string;
}

export interface EmployeeSessionRevokeResult {
  employeeId: string;
  sessionsRevoked: number;
}
