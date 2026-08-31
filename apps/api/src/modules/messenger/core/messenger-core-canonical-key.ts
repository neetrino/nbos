import { orderedParticipantIds } from '../messenger-participants.util';
import {
  MESSENGER_CORE_DEAL_KEY_PREFIX,
  MESSENGER_CORE_DIRECT_KEY_PREFIX,
  MESSENGER_CORE_LEGACY_CHANNEL_KEY_PREFIX,
  MESSENGER_CORE_PRODUCT_KEY_PREFIX,
  MESSENGER_CORE_PROJECT_GENERAL_KEY_PREFIX,
  MESSENGER_CORE_WORKSPACE_KEY_PREFIX,
} from './messenger-core.constants';

export function directCanonicalKey(employeeIdA: string, employeeIdB: string): string {
  const [low, high] = orderedParticipantIds(employeeIdA, employeeIdB);
  return `${MESSENGER_CORE_DIRECT_KEY_PREFIX}${low}:${high}`;
}

export function productCanonicalKey(productId: string): string {
  return `${MESSENGER_CORE_PRODUCT_KEY_PREFIX}${productId}`;
}

export function workspaceCanonicalKey(workspaceId: string): string {
  return `${MESSENGER_CORE_WORKSPACE_KEY_PREFIX}${workspaceId}`;
}

export function dealCanonicalKey(dealId: string): string {
  return `${MESSENGER_CORE_DEAL_KEY_PREFIX}${dealId}`;
}

export function projectGeneralCanonicalKey(projectId: string): string {
  return `${MESSENGER_CORE_PROJECT_GENERAL_KEY_PREFIX}${projectId}`;
}

export function legacyChannelCanonicalKey(channelId: string): string {
  return `${MESSENGER_CORE_LEGACY_CHANNEL_KEY_PREFIX}${channelId}`;
}

export function legacyDirectThreadSourceId(threadId: string): string {
  return threadId;
}
