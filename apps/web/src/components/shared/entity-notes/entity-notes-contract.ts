/**
 * Entity notes wire contract (phase 0 audit).
 *
 * - DB: `notes String?` on Lead, Deal, Contact, Expense, … — no schema change required.
 * - Stored value: HTML fragment when formatted; legacy plain strings stay valid until edited.
 * - Parent owns persistence (`value` / `onChange`); component is presentational.
 * - UI scope: label + toolbar + editor only (no thread, avatars, send).
 */

export const ENTITY_NOTE_ENTITY_TYPES = [
  'lead',
  'deal',
  'project',
  'task',
  'contact',
  'company',
  'expense',
  'support',
  'partner',
  'generic',
] as const;

export type EntityNoteEntityType = (typeof ENTITY_NOTE_ENTITY_TYPES)[number];
