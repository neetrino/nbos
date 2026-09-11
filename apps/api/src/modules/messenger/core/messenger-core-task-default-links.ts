import type { MessengerLinkEntityType } from '@nbos/database';
import { MESSENGER_CORE_TASK_SOURCE_CONTEXT_TYPES } from './messenger-core.constants';

const CONTEXT_TYPES = new Set<string>(MESSENGER_CORE_TASK_SOURCE_CONTEXT_TYPES);

export function defaultTaskLinksFromPrimary(
  links: Array<{ entityType: MessengerLinkEntityType; entityId: string; relationType: string }>,
): Array<{ entityType: MessengerLinkEntityType; entityId: string }> {
  const primary = links.filter((link) => link.relationType === 'PRIMARY');
  const productCount = primary.filter((link) => link.entityType === 'PRODUCT').length;
  return primary
    .filter((link) => CONTEXT_TYPES.has(link.entityType))
    .filter((link) => productCount <= 1 || link.entityType !== 'PRODUCT')
    .map((link) => ({ entityType: link.entityType, entityId: link.entityId }));
}
