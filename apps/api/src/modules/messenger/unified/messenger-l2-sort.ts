import type { MessengerL2ConversationDto } from './messenger-unified.types';

/** Pin PROJECT_GENERAL first; then activity; deterministic id tie-break. */
export function sortMessengerProjectTopics(
  rows: MessengerL2ConversationDto[],
): MessengerL2ConversationDto[] {
  return [...rows].sort((a, b) => {
    const priorityA = a.type === 'PROJECT_GENERAL' ? 0 : 1;
    const priorityB = b.type === 'PROJECT_GENERAL' ? 0 : 1;
    if (priorityA !== priorityB) return priorityA - priorityB;

    const timeA = a.lastMessageAt ? Date.parse(a.lastMessageAt) : Number.NEGATIVE_INFINITY;
    const timeB = b.lastMessageAt ? Date.parse(b.lastMessageAt) : Number.NEGATIVE_INFINITY;
    if (timeA !== timeB) return timeB - timeA;

    return a.id.localeCompare(b.id);
  });
}
