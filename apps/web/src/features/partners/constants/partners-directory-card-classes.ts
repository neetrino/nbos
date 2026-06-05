import { NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS } from '@/components/shared/navigable-entity-card.constants';

/** Partner directory card shell — same elevated shadow as hub entity cards. */
export const PARTNERS_DIRECTORY_CARD_CLASS = [
  'border-border bg-card hover:border-accent/40 focus-visible:ring-ring group w-full rounded-xl border p-5 text-left focus-visible:ring-2 focus-visible:outline-none',
  NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS,
].join(' ');
