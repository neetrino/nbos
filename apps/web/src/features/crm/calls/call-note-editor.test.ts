import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api-errors';
import { canSaveCallNote, isCallNoteConflictError } from './call-note-editor';

describe('call note editor helpers', () => {
  it('enables Save only for a terminal Call with CRM EDIT', () => {
    expect(canSaveCallNote('ended', true)).toBe(true);
    expect(canSaveCallNote('ended', false)).toBe(false);
    expect(canSaveCallNote('ringing', true)).toBe(false);
    expect(canSaveCallNote('answered', true)).toBe(false);
  });

  it('treats HTTP 409 as a note conflict without auto-overwrite', () => {
    expect(isCallNoteConflictError(new ApiError('conflict', { statusCode: 409 }))).toBe(true);
    expect(isCallNoteConflictError(new ApiError('denied', { statusCode: 403 }))).toBe(false);
    expect(isCallNoteConflictError(new Error('conflict'))).toBe(false);
  });
});
