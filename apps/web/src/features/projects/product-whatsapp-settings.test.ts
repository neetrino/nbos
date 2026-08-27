import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-errors';
import type { ProductWhatsAppState } from '@/lib/api/whatsapp';
import { isMissingActiveWhatsAppGroup } from '@/features/crm/deal-won-whatsapp-gate';
import {
  loadProductWhatsAppSettings,
  nextProductWhatsAppSettingsState,
  productWhatsAppBindingView,
  WHATSAPP_GATEWAY_NOT_CONFIGURED,
  WHATSAPP_GATEWAY_NOT_CONFIGURED_MESSAGE,
  type ProductWhatsAppSettingsClient,
} from './product-whatsapp-settings';

const TOONEXPO_PRODUCT_ID = '04028811-0687-4b4e-9cb1-7f35ac96f1ba';
const TOONEXPO_GROUP_CHAT_ID = '120363427204311641@g.us';

describe('loadProductWhatsAppSettings', () => {
  it('keeps ACTIVE groupChatId when available-groups returns 400 GATEWAY_NOT_CONFIGURED', async () => {
    const snapshot = await loadProductWhatsAppSettings(
      TOONEXPO_PRODUCT_ID,
      undefined,
      createClient({
        state: activeToonexpoState(),
        groupsError: gatewayNotConfiguredError(),
      }),
    );

    const view = productWhatsAppBindingView(snapshot.state);
    expect(view.status).toBe('ACTIVE');
    expect(view.groupChatId).toBe(TOONEXPO_GROUP_CHAT_ID);
    expect(view.groupName).toBeNull();
    expect(snapshot.groups).toEqual([]);
    expect(snapshot.gatewayConfigured).toBe(false);
    expect(snapshot.gatewayNotice).toBe(WHATSAPP_GATEWAY_NOT_CONFIGURED_MESSAGE);
    expect(snapshot.selectedGroupId).toBe(TOONEXPO_GROUP_CHAT_ID);
    expect(
      isMissingActiveWhatsAppGroup({
        bindingStatus: view.status,
        groupChatId: view.groupChatId,
      }),
    ).toBe(false);
  });

  it('does not wipe a previously loaded binding when a later getState fails', async () => {
    const previous = await loadProductWhatsAppSettings(
      TOONEXPO_PRODUCT_ID,
      undefined,
      createClient({
        state: activeToonexpoState(),
        groupsError: gatewayNotConfiguredError(),
      }),
    );
    const later = await loadProductWhatsAppSettings(
      TOONEXPO_PRODUCT_ID,
      undefined,
      createClient({
        stateError: new ApiError('network'),
        groupsError: gatewayNotConfiguredError(),
      }),
    );

    const merged = nextProductWhatsAppSettingsState(previous.state, later.state);
    expect(productWhatsAppBindingView(merged).groupChatId).toBe(TOONEXPO_GROUP_CHAT_ID);
  });

  it('marks Gateway configured and returns groups when both calls succeed', async () => {
    const snapshot = await loadProductWhatsAppSettings(
      TOONEXPO_PRODUCT_ID,
      'expo',
      createClient({
        state: activeToonexpoState(),
        groups: {
          groups: [{ id: TOONEXPO_GROUP_CHAT_ID, name: 'Toonexpo' }],
          currentGroupChatId: TOONEXPO_GROUP_CHAT_ID,
        },
      }),
    );

    expect(snapshot.gatewayConfigured).toBe(true);
    expect(snapshot.gatewayNotice).toBeNull();
    expect(snapshot.groups).toHaveLength(1);
    expect(snapshot.selectedGroupId).toBe(TOONEXPO_GROUP_CHAT_ID);
  });
});

function activeToonexpoState(): ProductWhatsAppState {
  return {
    productId: TOONEXPO_PRODUCT_ID,
    binding: {
      id: TOONEXPO_PRODUCT_ID,
      groupChatId: TOONEXPO_GROUP_CHAT_ID,
      groupName: null,
      status: 'ACTIVE',
      lastSuccessfulSyncAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
    participants: [],
    invitation: null,
    latestOperation: null,
  };
}

function gatewayNotConfiguredError(): ApiError {
  return new ApiError(WHATSAPP_GATEWAY_NOT_CONFIGURED_MESSAGE, {
    statusCode: 400,
    code: WHATSAPP_GATEWAY_NOT_CONFIGURED,
  });
}

function createClient(input: {
  state?: ProductWhatsAppState;
  stateError?: unknown;
  groups?: { groups: { id: string; name: string }[]; currentGroupChatId: string | null };
  groupsError?: unknown;
}): ProductWhatsAppSettingsClient {
  return {
    getState: vi.fn(async () => {
      if (input.stateError) throw input.stateError;
      if (!input.state) throw new Error('missing getState fixture');
      return input.state;
    }),
    availableGroups: vi.fn(async () => {
      if (input.groupsError) throw input.groupsError;
      return input.groups ?? { groups: [], currentGroupChatId: null };
    }),
  };
}
