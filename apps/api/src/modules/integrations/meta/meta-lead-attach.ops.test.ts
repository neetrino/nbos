import { describe, expect, it, vi } from 'vitest';
import { resolveMetaIngestLeadId } from './meta-lead-attach.ops';

describe('resolveMetaIngestLeadId', () => {
  it('creates a Lead when no open Instagram identity match exists', async () => {
    const createLead = vi.fn().mockResolvedValue('new-lead');
    const tx = {
      lead: { findFirst: vi.fn().mockResolvedValue(null) },
      metaConversation: { findUnique: vi.fn() },
    };
    const id = await resolveMetaIngestLeadId(tx as never, 'karo_gabrielyan', createLead);
    expect(id).toBe('new-lead');
    expect(createLead).toHaveBeenCalled();
  });

  it('attaches to an open Lead with the same Instagram username when it has no conversation', async () => {
    const createLead = vi.fn();
    const tx = {
      lead: { findFirst: vi.fn().mockResolvedValue({ id: 'existing-ig' }) },
      metaConversation: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const id = await resolveMetaIngestLeadId(tx as never, 'karo_gabrielyan', createLead);
    expect(id).toBe('existing-ig');
    expect(createLead).not.toHaveBeenCalled();
  });

  it('does not create a second Lead when the matched Lead already has a Meta conversation', async () => {
    const createLead = vi.fn();
    const tx = {
      lead: { findFirst: vi.fn().mockResolvedValue({ id: 'survivor' }) },
      metaConversation: { findUnique: vi.fn().mockResolvedValue({ id: 'conv-surv' }) },
    };
    const id = await resolveMetaIngestLeadId(tx as never, 'karo_gabrielyan', createLead);
    expect(id).toBeNull();
    expect(createLead).not.toHaveBeenCalled();
  });
});
