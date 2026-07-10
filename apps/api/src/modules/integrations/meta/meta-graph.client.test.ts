import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MetaGraphClient } from './meta-graph.client';

const GRAPH_BASE_URL = 'https://graph.facebook.com/v21.0';
const NUMERIC_PSID = '17841400000000001';

function createClient(): MetaGraphClient {
  return new MetaGraphClient(GRAPH_BASE_URL, 'app-id', 'app-secret');
}

describe('MetaGraphClient.fetchMessagingUserProfile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps Facebook profile fields', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        first_name: 'Karo',
        last_name: 'Gabrielyan',
        name: 'Karo Gabrielyan',
        profile_pic: 'https://example.com/pic.jpg',
      }),
    } as Response);

    const result = await createClient().fetchMessagingUserProfile(NUMERIC_PSID, 'page-token');
    expect(result).toEqual({
      ok: true,
      profile: {
        displayName: 'Karo Gabrielyan',
        username: null,
        firstName: 'Karo',
        lastName: 'Gabrielyan',
        profilePictureUrl: 'https://example.com/pic.jpg',
      },
    });

    const [calledUrl, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(new URL(calledUrl).origin).toBe('https://graph.facebook.com');
    expect(init.redirect).toBe('error');
  });

  it('returns failure without throwing on permission errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: { message: 'Permissions error', code: 200 },
      }),
    } as Response);

    const result = await createClient().fetchMessagingUserProfile(NUMERIC_PSID, 'page-token');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe('200');
    }
  });

  it('returns validation failure for non-numeric senderScopedId', async () => {
    const result = await createClient().fetchMessagingUserProfile('psid-1', 'page-token');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe('invalid_resource_id');
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});
