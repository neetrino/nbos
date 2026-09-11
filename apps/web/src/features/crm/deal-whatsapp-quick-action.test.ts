import { describe, expect, it, vi } from 'vitest';
import {
  buildDealWhatsAppQuickActions,
  canCreateDealLevelWhatsAppGroup,
} from './deal-whatsapp-quick-action';

const base = {
  dealType: 'PRODUCT' as string | null,
  contactId: 'c1' as string | null,
  productId: null as string | null,
  projectId: undefined as string | undefined,
  bindingStatus: null as string | null,
  groupChatId: null as string | null,
  latestOperationStatus: null as string | null,
  whatsappBusy: false,
  onEnsure: vi.fn(),
  onBind: vi.fn(),
  onOpenSettings: vi.fn(),
  onCopyGroupId: vi.fn(),
};

describe('buildDealWhatsAppQuickActions', () => {
  it('allows create on PRODUCT deals without a Product when Contact exists', () => {
    expect(canCreateDealLevelWhatsAppGroup(base)).toBe(true);
    const create = buildDealWhatsAppQuickActions(base)[0];
    expect(create?.enabled).toBe(true);
    expect(create?.label).toBe('Create group');
  });

  it('disables create when Contact is missing', () => {
    const action = buildDealWhatsAppQuickActions({ ...base, contactId: null })[0];
    expect(action?.enabled).toBe(false);
    expect(action?.disabledTitle).toMatch(/Contact/i);
  });

  it('disables create for EXTENSION without Product', () => {
    const action = buildDealWhatsAppQuickActions({ ...base, dealType: 'EXTENSION' })[0];
    expect(action?.enabled).toBe(false);
  });

  it('shows creating while the job is in flight', () => {
    const actions = buildDealWhatsAppQuickActions({
      ...base,
      latestOperationStatus: 'QUEUED',
    });
    expect(actions[0]?.enabled).toBe(false);
    expect(actions[0]?.label).toBe('Creating group…');
    expect(actions[1]?.enabled).toBe(false);
  });

  it('holds Settings instead of Create while Product state is still loading', () => {
    const action = buildDealWhatsAppQuickActions({
      ...base,
      dealType: 'EXTENSION',
      productId: 'p1',
      stateReady: false,
    })[0];
    expect(action?.id).toBe('whatsapp-settings');
    expect(action?.label).toBe('Settings');
  });

  it('offers retry after FAILED', () => {
    const action = buildDealWhatsAppQuickActions({
      ...base,
      latestOperationStatus: 'FAILED',
    })[0];
    expect(action?.id).toBe('whatsapp-retry');
    expect(action?.enabled).toBe(true);
  });
});
