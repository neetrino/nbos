import { BadRequestException } from '@nestjs/common';
import type {
  MessengerConversationType,
  MessengerConversationZone,
  MessengerMessageDirection,
} from '@nbos/database';
import {
  MESSENGER_CORE_CLIENT_TYPES,
  MESSENGER_CORE_INTERNAL_TYPES,
} from './messenger-core.constants';

const INTERNAL_TYPE_SET = new Set<string>(MESSENGER_CORE_INTERNAL_TYPES);
const CLIENT_TYPE_SET = new Set<string>(MESSENGER_CORE_CLIENT_TYPES);

export function assertZoneTypeCompatibility(
  zone: MessengerConversationZone,
  type: MessengerConversationType,
): void {
  if (zone === 'INTERNAL' && !INTERNAL_TYPE_SET.has(type)) {
    throw new BadRequestException('INTERNAL conversations cannot use a Client type');
  }
  if (zone === 'CLIENT' && !CLIENT_TYPE_SET.has(type)) {
    throw new BadRequestException('CLIENT conversations cannot use an Internal type');
  }
}

export function defaultDirectionForZone(
  zone: MessengerConversationZone,
): MessengerMessageDirection {
  return zone === 'CLIENT' ? 'OUTBOUND' : 'INTERNAL';
}

export function assertMessageDirectionForZone(
  zone: MessengerConversationZone,
  direction: MessengerMessageDirection,
): void {
  if (zone === 'INTERNAL' && direction !== 'INTERNAL') {
    throw new BadRequestException('INTERNAL conversations only accept INTERNAL message direction');
  }
  if (zone === 'CLIENT' && direction === 'INTERNAL') {
    throw new BadRequestException('CLIENT conversations require INBOUND or OUTBOUND direction');
  }
}

export function isInternalZone(zone: MessengerConversationZone): boolean {
  return zone === 'INTERNAL';
}
