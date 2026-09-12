import { DESK_LINE_EVERYDAY_A } from './desk-line-catalog-everyday-a';
import { DESK_LINE_EVERYDAY_B } from './desk-line-catalog-everyday-b';
import { DESK_LINE_EVERYDAY_C } from './desk-line-catalog-everyday-c';
import { DESK_LINE_EVENTS_CATALOG } from './desk-line-catalog-events';
import { DESK_LINE_SEASONS_CATALOG } from './desk-line-catalog-seasons';
import type { DeskLinePoolId, DeskLineTemplate } from './desk-line.types';

export const DESK_LINE_CATALOG: readonly DeskLineTemplate[] = [
  ...DESK_LINE_EVERYDAY_A,
  ...DESK_LINE_EVERYDAY_B,
  ...DESK_LINE_EVERYDAY_C,
  ...DESK_LINE_SEASONS_CATALOG,
  ...DESK_LINE_EVENTS_CATALOG,
];

export function deskLinePool(pool: DeskLinePoolId, eventId?: string): DeskLineTemplate[] {
  return DESK_LINE_CATALOG.filter((line) => {
    if (line.pool !== pool) return false;
    if (eventId) return line.eventId === eventId;
    return true;
  });
}
