import { describe, expect, it, vi } from 'vitest';
import {
  DEAL_WHATSAPP_HEADER_LABEL,
  resolveDealWhatsAppHeaderPresentation,
} from './deal-whatsapp-header-control';
import { buildDealWhatsAppQuickActions } from './deal-whatsapp-quick-action';

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

describe('resolveDealWhatsAppHeaderPresentation', () => {
  it('keeps the trigger labeled WhatsApp when create and bind are available', () => {
    const view = resolveDealWhatsAppHeaderPresentation(buildDealWhatsAppQuickActions(base));
    expect(view.mode).toBe('menu');
    expect(view.triggerLabel).toBe(DEAL_WHATSAPP_HEADER_LABEL);
  });

  it('shows a muted WhatsApp chip when no action is available', () => {
    const view = resolveDealWhatsAppHeaderPresentation(
      buildDealWhatsAppQuickActions({ ...base, contactId: null }),
    );
    expect(view.mode).toBe('disabled');
    expect(view.triggerLabel).toBe(DEAL_WHATSAPP_HEADER_LABEL);
    expect(view.tone).toBe('muted');
  });

  it('keeps WhatsApp while the job is in flight', () => {
    const view = resolveDealWhatsAppHeaderPresentation(
      buildDealWhatsAppQuickActions({ ...base, latestOperationStatus: 'QUEUED' }),
    );
    expect(view.mode).toBe('disabled');
    expect(view.triggerLabel).toBe(DEAL_WHATSAPP_HEADER_LABEL);
    expect(view.tone).toBe('pending');
  });

  it('opens a WhatsApp menu after FAILED instead of renaming the trigger', () => {
    const view = resolveDealWhatsAppHeaderPresentation(
      buildDealWhatsAppQuickActions({ ...base, latestOperationStatus: 'FAILED' }),
    );
    expect(view.mode).toBe('menu');
    expect(view.triggerLabel).toBe(DEAL_WHATSAPP_HEADER_LABEL);
    expect(view.items[0]?.id).toBe('whatsapp-retry');
  });

  it('opens a WhatsApp menu when the group is already active', () => {
    const view = resolveDealWhatsAppHeaderPresentation(
      buildDealWhatsAppQuickActions({
        ...base,
        productId: 'p1',
        bindingStatus: 'ACTIVE',
        groupChatId: '120363012345678901@g.us',
      }),
    );
    expect(view.mode).toBe('menu');
    expect(view.triggerLabel).toBe(DEAL_WHATSAPP_HEADER_LABEL);
    expect(view.items.map((item) => item.id)).toEqual([
      'whatsapp-settings',
      'whatsapp-bind',
      'whatsapp-copy-id',
    ]);
  });

  it('runs a single enabled action from a WhatsApp-labeled button', () => {
    const actions = buildDealWhatsAppQuickActions(base).map((action, index) =>
      index === 0 ? action : { ...action, enabled: false },
    );
    const view = resolveDealWhatsAppHeaderPresentation(actions);
    expect(view.mode).toBe('direct');
    expect(view.directAction?.id).toBe('whatsapp-group');
    expect(view.triggerLabel).toBe(DEAL_WHATSAPP_HEADER_LABEL);
  });

  it('does not flash Create group on a Product deal before state is ready', () => {
    const actions = buildDealWhatsAppQuickActions({
      ...base,
      dealType: 'EXTENSION',
      productId: 'p1',
      stateReady: false,
    });
    expect(actions[0]?.id).toBe('whatsapp-settings');
    const view = resolveDealWhatsAppHeaderPresentation(actions);
    expect(view.triggerLabel).toBe(DEAL_WHATSAPP_HEADER_LABEL);
    expect(view.mode).toBe('menu');
  });
});
