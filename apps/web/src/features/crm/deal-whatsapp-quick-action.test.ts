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
    expect(create?.label).toBe('Create WhatsApp group');
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
    const action = buildDealWhatsAppQuickActions({
      ...base,
      latestOperationStatus: 'QUEUED',
    })[0];
    expect(action?.enabled).toBe(false);
    expect(action?.label).toBe('Creating group…');
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
