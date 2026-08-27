import { ApiError, getApiErrorMessage } from '@/lib/api-errors';
import {
  productWhatsAppApi,
  type ProductWhatsAppState,
  type WhatsAppAvailableGroup,
} from '@/lib/api/whatsapp';

export const WHATSAPP_GATEWAY_NOT_CONFIGURED = 'WHATSAPP_GATEWAY_NOT_CONFIGURED';
export const WHATSAPP_GATEWAY_NOT_CONFIGURED_MESSAGE = 'WhatsApp Gateway is not configured';

export interface ProductWhatsAppSettingsClient {
  getState(productId: string): Promise<ProductWhatsAppState>;
  availableGroups(
    productId: string,
    search?: string,
  ): Promise<{ groups: WhatsAppAvailableGroup[]; currentGroupChatId: string | null }>;
}

export interface ProductWhatsAppSettingsSnapshot {
  state: ProductWhatsAppState | null;
  groups: WhatsAppAvailableGroup[];
  selectedGroupId: string;
  gatewayConfigured: boolean;
  gatewayNotice: string | null;
  stateError: unknown | null;
}

export interface ProductWhatsAppBindingView {
  status: string;
  groupChatId: string | null;
  groupName: string | null;
}

/** True when available-groups (or any WhatsApp call) failed because Gateway has no URL/token. */
export function isWhatsAppGatewayNotConfiguredError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.code === WHATSAPP_GATEWAY_NOT_CONFIGURED) return true;
  return error.message === WHATSAPP_GATEWAY_NOT_CONFIGURED_MESSAGE;
}

/** Keep a previously rendered binding when a later getState call fails. */
export function nextProductWhatsAppSettingsState(
  previous: ProductWhatsAppState | null,
  loaded: ProductWhatsAppState | null,
): ProductWhatsAppState | null {
  return loaded ?? previous;
}

/** Fields Product settings renders from getState — independent of Gateway health. */
export function productWhatsAppBindingView(
  state: ProductWhatsAppState | null,
): ProductWhatsAppBindingView {
  return {
    status: state?.binding?.status ?? 'NOT_STARTED',
    groupChatId: state?.binding?.groupChatId ?? null,
    groupName: state?.binding?.groupName ?? null,
  };
}

/**
 * Load binding from DB and Gateway groups independently.
 * A failed available-groups call never discards getState.
 */
export async function loadProductWhatsAppSettings(
  productId: string,
  search?: string,
  client: ProductWhatsAppSettingsClient = productWhatsAppApi,
): Promise<ProductWhatsAppSettingsSnapshot> {
  const [stateResult, groupsResult] = await Promise.allSettled([
    client.getState(productId),
    client.availableGroups(productId, search),
  ]);

  const state = stateResult.status === 'fulfilled' ? stateResult.value : null;
  const stateError = stateResult.status === 'rejected' ? stateResult.reason : null;
  if (groupsResult.status === 'fulfilled') {
    return snapshotFromGroupsSuccess(state, stateError, groupsResult.value);
  }
  return snapshotFromGroupsFailure(state, stateError, groupsResult.reason);
}

function snapshotFromGroupsSuccess(
  state: ProductWhatsAppState | null,
  stateError: unknown | null,
  available: { groups: WhatsAppAvailableGroup[]; currentGroupChatId: string | null },
): ProductWhatsAppSettingsSnapshot {
  return {
    state,
    groups: available.groups,
    selectedGroupId: available.currentGroupChatId ?? state?.binding?.groupChatId ?? '',
    gatewayConfigured: true,
    gatewayNotice: null,
    stateError,
  };
}

function snapshotFromGroupsFailure(
  state: ProductWhatsAppState | null,
  stateError: unknown | null,
  groupsError: unknown,
): ProductWhatsAppSettingsSnapshot {
  const notConfigured = isWhatsAppGatewayNotConfiguredError(groupsError);
  return {
    state,
    groups: [],
    selectedGroupId: state?.binding?.groupChatId ?? '',
    gatewayConfigured: !notConfigured,
    gatewayNotice: notConfigured
      ? WHATSAPP_GATEWAY_NOT_CONFIGURED_MESSAGE
      : getApiErrorMessage(groupsError, 'Could not load WhatsApp groups.'),
    stateError,
  };
}
