/**
 * Owner-initiated recovery is visible only when the platform owner opens **someone else's** card.
 * The API enforces the same rules; this keeps the sheet from offering an action that would be
 * rejected (own record) or pointless.
 */
export function canManageEmployeeSecurity(input: {
  selfProfile: boolean;
  actorId?: string;
  actorIsPlatformOwner?: boolean;
  employeeId: string;
  employeeStatus: string;
}): boolean {
  if (input.selfProfile) return false;
  if (input.actorIsPlatformOwner !== true) return false;
  if (!input.actorId || input.actorId === input.employeeId) return false;
  return input.employeeStatus !== 'TERMINATED';
}
