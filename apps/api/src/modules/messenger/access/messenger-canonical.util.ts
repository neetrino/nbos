import { orderedParticipantIds } from '../messenger-participants.util';

export type MessengerCanonicalConversationType =
  | 'PROJECT_GENERAL'
  | 'PRODUCT'
  | 'DEAL'
  | 'TASK'
  | 'DIRECT';

export type MessengerLinkEntityType = 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK' | 'WORKSPACE';

export type MessengerCanonicalPrimaryEntityType = 'PROJECT' | 'PRODUCT' | 'DEAL' | 'TASK';

const CANONICAL_PRIMARY_ENTITY: Record<
  Exclude<MessengerCanonicalConversationType, 'DIRECT'>,
  MessengerCanonicalPrimaryEntityType
> = {
  PROJECT_GENERAL: 'PROJECT',
  PRODUCT: 'PRODUCT',
  DEAL: 'DEAL',
  TASK: 'TASK',
};

/** Build DB `canonical_key` for entity-scoped or DIRECT conversations. */
export function buildMessengerCanonicalKey(
  type: MessengerCanonicalConversationType,
  entityOrEmployeeAId: string,
  employeeBId?: string,
): string {
  switch (type) {
    case 'PROJECT_GENERAL':
      return `project_general:${entityOrEmployeeAId}`;
    case 'PRODUCT':
      return `product:${entityOrEmployeeAId}`;
    case 'DEAL':
      return `deal:${entityOrEmployeeAId}`;
    case 'TASK':
      return `task:${entityOrEmployeeAId}`;
    case 'DIRECT': {
      if (!employeeBId) {
        throw new Error('DIRECT canonical key requires two employee ids');
      }
      if (entityOrEmployeeAId === employeeBId) {
        throw new Error('DIRECT canonical key requires two distinct employee ids');
      }
      const [low, high] = orderedParticipantIds(entityOrEmployeeAId, employeeBId);
      return `direct:${low}:${high}`;
    }
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function primaryEntityTypeForConversationType(
  type: Exclude<MessengerCanonicalConversationType, 'DIRECT'>,
): MessengerCanonicalPrimaryEntityType {
  return CANONICAL_PRIMARY_ENTITY[type];
}

export function isConversationTypeCompatibleWithPrimaryEntity(
  conversationType: MessengerCanonicalConversationType,
  entityType: MessengerLinkEntityType,
): boolean {
  if (conversationType === 'DIRECT') return false;
  return CANONICAL_PRIMARY_ENTITY[conversationType] === entityType;
}

export const MESSENGER_PARTICIPANT_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'READ_ONLY'] as const;
export type MessengerParticipantRoleValue = (typeof MESSENGER_PARTICIPANT_ROLES)[number];

export function isMessengerParticipantRole(value: string): value is MessengerParticipantRoleValue {
  return (MESSENGER_PARTICIPANT_ROLES as readonly string[]).includes(value);
}

/** LOCKED conversations reject sends; ARCHIVED may still be readable. */
export function canSendAgainstConversationStatus(status: 'ACTIVE' | 'ARCHIVED' | 'LOCKED'): boolean {
  return status === 'ACTIVE' || status === 'ARCHIVED';
}
