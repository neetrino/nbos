/** Extra MESSENGER capabilities: Client conversation READ vs SEND. Key = module_action. */
export const MESSENGER_MODULE = 'MESSENGER' as const;
export const MESSENGER_CLIENT_READ_ACTION = 'CLIENT_READ' as const;
export const MESSENGER_CLIENT_SEND_ACTION = 'CLIENT_SEND' as const;

export const MESSENGER_CLIENT_READ_PERMISSION =
  `${MESSENGER_MODULE}_${MESSENGER_CLIENT_READ_ACTION}` as const;
export const MESSENGER_CLIENT_SEND_PERMISSION =
  `${MESSENGER_MODULE}_${MESSENGER_CLIENT_SEND_ACTION}` as const;

export const MESSENGER_CLIENT_READ_PERMISSION_ID = 'perm-messenger-client-read' as const;
export const MESSENGER_CLIENT_SEND_PERMISSION_ID = 'perm-messenger-client-send' as const;

/**
 * Roles with full Internal Messenger (MESSENGER VIEW/EDIT ALL) that also receive
 * Client READ/SEND ALL. Developers and other OWN/NONE roles are omitted on purpose.
 */
export const MESSENGER_CLIENT_CAPABILITY_ALL_ROLE_IDS = [
  'role-owner',
  'role-ceo',
  'role-pm',
  'role-head-sales',
  'role-head-delivery',
] as const;

/** Client-facing sellers receive OWN Client READ/SEND; membership is still required. */
export const MESSENGER_CLIENT_CAPABILITY_OWN_ROLE_IDS = ['role-seller'] as const;
