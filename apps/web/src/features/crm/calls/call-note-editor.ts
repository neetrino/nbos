import { ApiError } from '@/lib/api-errors';
import type { ActiveCallPhase } from '@/lib/api/calls';

export const CALL_NOTE_CONFLICT_MESSAGE =
  'This note was changed elsewhere. Your draft is still here — save again to keep it.';

export function isCallNoteConflictError(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 409;
}

export function canSaveCallNote(phase: ActiveCallPhase, hasCrmEdit: boolean): boolean {
  return phase === 'ended' && hasCrmEdit;
}
