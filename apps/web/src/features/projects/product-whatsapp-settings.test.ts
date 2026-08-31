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

  it('prefers resolver WORK groupChatId when unique-legacy id is absent', () => {
    const view = productWhatsAppBindingView({
      productId: TOONEXPO_PRODUCT_ID,
      binding: {
        id: null,
        groupChatId: TOONEXPO_GROUP_CHAT_ID,
        groupName: null,
        status: 'ACTIVE',
        lastSuccessfulSyncAt: null,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
      work: {
        conversationId: 'conv-shared',
        groupChatId: TOONEXPO_GROUP_CHAT_ID,
        fallbackFromWork: false,
      },
      participants: [],
      invitation: null,
      latestOperation: null,
    });
    expect(view.status).toBe('ACTIVE');
    expect(view.groupChatId).toBe(TOONEXPO_GROUP_CHAT_ID);
  });

  it('does not show leftover unique-legacy as current WORK when resolver WORK is empty', async () => {
    const snapshot = await loadProductWhatsAppSettings(
      TOONEXPO_PRODUCT_ID,
      undefined,
      createClient({
        state: leftoverUniqueLegacyState(),
        groupsError: gatewayNotConfiguredError(),
      }),
    );
    const view = productWhatsAppBindingView(snapshot.state);
    expect(view.groupChatId).toBeNull();
    expect(view.status).toBe('NOT_STARTED');
    expect(view.groupName).toBeNull();
    expect(snapshot.selectedGroupId).toBe('');
  });

  it('FINDING-S9-09 after S9-05 detach, getState+view is ACTIVE Group1 not FAILED old name', async () => {
    const snapshot = await loadProductWhatsAppSettings(
      TOONEXPO_PRODUCT_ID,
      undefined,
      createClient({
        state: detachedUniqueLegacyWithLiveWorkState(),
        groupsError: gatewayNotConfiguredError(),
      }),
    );
    const view = productWhatsAppBindingView(snapshot.state);
    expect(view.status).toBe('ACTIVE');
    expect(view.groupChatId).toBe(TOONEXPO_GROUP_CHAT_ID);
    expect(view.groupName).not.toBe('GroupB');
    expect(view.groupName).toBeNull();
    expect(view.status === 'FAILED').toBe(false);
    expect(snapshot.selectedGroupId).toBe(TOONEXPO_GROUP_CHAT_ID);
  });

  it('keeps unique-legacy groupName only while it still matches WORK', () => {
    const state = activeToonexpoState();
    const binding = state.binding;
    if (!binding) throw new Error('expected unique-legacy fixture');
    const view = productWhatsAppBindingView({
      ...state,
      binding: { ...binding, groupName: 'Group1' },
    });
    expect(view.status).toBe('ACTIVE');
    expect(view.groupName).toBe('Group1');
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
    work: {
      conversationId: 'conv-toonexpo',
      groupChatId: TOONEXPO_GROUP_CHAT_ID,
      fallbackFromWork: false,
    },
    participants: [],
    invitation: null,
    latestOperation: null,
  };
}

function leftoverUniqueLegacyState(): ProductWhatsAppState {
  return {
    productId: TOONEXPO_PRODUCT_ID,
    binding: {
      id: 'legacy-1',
      groupChatId: TOONEXPO_GROUP_CHAT_ID,
      groupName: 'Leftover',
      status: 'ACTIVE',
      lastSuccessfulSyncAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
    work: null,
    participants: [],
    invitation: null,
    latestOperation: null,
  };
}

/** getState shape after S9-05 detach: unique-legacy FAILED + stale name, live WORK Group1. */
function detachedUniqueLegacyWithLiveWorkState(): ProductWhatsAppState {
  return {
    productId: TOONEXPO_PRODUCT_ID,
    binding: {
      id: 'legacy-b',
      groupChatId: TOONEXPO_GROUP_CHAT_ID,
      groupName: 'GroupB',
      status: 'FAILED',
      lastSuccessfulSyncAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
    work: {
      conversationId: 'conv-shared',
      groupChatId: TOONEXPO_GROUP_CHAT_ID,
      fallbackFromWork: false,
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
