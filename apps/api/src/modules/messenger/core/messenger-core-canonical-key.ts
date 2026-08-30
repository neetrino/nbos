import { orderedParticipantIds } from '../messenger-participants.util';
import {
  MESSENGER_CORE_DIRECT_KEY_PREFIX,
  MESSENGER_CORE_LEGACY_CHANNEL_KEY_PREFIX,
} from './messenger-core.constants';

export function directCanonicalKey(employeeIdA: string, employeeIdB: string): string {
  const [low, high] = orderedParticipantIds(employeeIdA, employeeIdB);
  return `${MESSENGER_CORE_DIRECT_KEY_PREFIX}${low}:${high}`;
}

export function legacyChannelCanonicalKey(channelId: string): string {
  return `${MESSENGER_CORE_LEGACY_CHANNEL_KEY_PREFIX}${channelId}`;
}

export function legacyDirectThreadSourceId(threadId: string): string {
  return threadId;
}
