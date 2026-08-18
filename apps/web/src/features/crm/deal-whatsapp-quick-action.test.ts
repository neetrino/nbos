import { describe, expect, it, vi } from 'vitest';
import { buildDealWhatsAppQuickAction } from './deal-whatsapp-quick-action';

const base = {
  productId: 'prod-1',
  projectId: 'proj-1',
  bindingStatus: null as string | null,
  latestOperationStatus: null as string | null,
  whatsappBusy: false,
  onEnsure: vi.fn(),
  onOpenSettings: vi.fn(),
};

describe('buildDealWhatsAppQuickAction', () => {
  it('disables create when product is missing', () => {
    const action = buildDealWhatsAppQuickAction({ ...base, productId: null });
    expect(action.enabled).toBe(false);
    expect(action.label).toBe('Create WhatsApp group');
  });

  it('shows creating while the job is in flight', () => {
    const action = buildDealWhatsAppQuickAction({
      ...base,
      latestOperationStatus: 'QUEUED',
    });
    expect(action.enabled).toBe(false);
    expect(action.label).toBe('Creating group…');
  });

  it('offers retry after FAILED', () => {
    const action = buildDealWhatsAppQuickAction({
      ...base,
      latestOperationStatus: 'FAILED',
    });
    expect(action.id).toBe('whatsapp-retry');
    expect(action.enabled).toBe(true);
  });
});
