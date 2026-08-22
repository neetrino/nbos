import { describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { callsApi } from './calls';

vi.mock('../api', () => ({
  api: {
    patch: vi.fn(),
    get: vi.fn(),
  },
}));

describe('callsApi.updateNote', () => {
  it('sends expectedNoteVersion with the note', async () => {
    const snapshot = { callId: 'call-1', note: 'Saved', noteVersion: 5 };
    vi.mocked(api.patch).mockResolvedValue({ data: snapshot });

    await expect(
      callsApi.updateNote('call-1', { note: 'Saved', expectedNoteVersion: 4 }),
    ).resolves.toEqual(snapshot);
    expect(api.patch).toHaveBeenCalledWith('/api/crm/calls/call-1/note', {
      note: 'Saved',
      expectedNoteVersion: 4,
    });
  });
});
