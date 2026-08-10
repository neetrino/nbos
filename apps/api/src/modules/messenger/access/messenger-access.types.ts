import type { MessengerLegacyAccessContext, MessengerRbacScope } from './messenger-legacy-channel-access.op';

/**
 * Unified MessengerConversation access context — same RBAC scopes as live MESSENGER_* permissions.
 */
export type MessengerAccessContext = {
  employeeId: string;
  viewScope: MessengerRbacScope;
  editScope: MessengerRbacScope;
  departmentIds: string[];
  driveViewScope?: string;
};

export function messengerViewBypassesRowFilter(viewScope: MessengerRbacScope | null | undefined): boolean {
  return viewScope === 'ALL';
}

/** Map legacy loaded access into the unified access shape. */
export function toMessengerAccessContext(
  legacy: MessengerLegacyAccessContext,
): MessengerAccessContext {
  return {
    employeeId: legacy.employeeId,
    viewScope: legacy.viewScope,
    editScope: legacy.editScope,
    departmentIds: legacy.departmentIds,
    driveViewScope: legacy.driveViewScope,
  };
}
