import type { AuditLogEntry } from '@/lib/api/audit';
import type { SupportTicket } from '@/lib/api/support';

export interface SupportTriageDraft {
  title: string;
  description: string;
  category: string;
  priority: string;
  coverageDecision: string;
  billable: boolean;
  assignedTo: string;
  productId: string;
  contactId: string;
}

export function triageDraftFromTicket(t: SupportTicket): SupportTriageDraft {
  return {
    title: t.title,
    description: t.description ?? '',
    category: t.category,
    priority: t.priority,
    coverageDecision: t.coverageDecision ?? '',
    billable: t.billable,
    assignedTo: t.assignedTo ?? '',
    productId: t.productId ?? '',
    contactId: t.contact?.id ?? '',
  };
}

export function isSupportTriageDirty(a: SupportTriageDraft, b: SupportTriageDraft): boolean {
  return (
    a.title !== b.title ||
    a.description !== b.description ||
    a.category !== b.category ||
    a.priority !== b.priority ||
    a.coverageDecision !== b.coverageDecision ||
    a.billable !== b.billable ||
    a.assignedTo !== b.assignedTo ||
    a.productId !== b.productId ||
    a.contactId !== b.contactId
  );
}

export function formatSupportAuditLine(entry: AuditLogEntry): string {
  const ch = entry.changes as Record<string, unknown> | null;
  if (!ch) return entry.action;
  if (typeof ch.from === 'string' && typeof ch.to === 'string') {
    return `${entry.action}: ${ch.from} → ${ch.to}`;
  }
  return entry.action;
}

export function buildSupportTicketTriageUpdatePatch(
  draft: SupportTriageDraft,
  snap: SupportTriageDraft,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (draft.title !== snap.title) patch.title = draft.title.trim();
  if (draft.description !== snap.description) {
    patch.description = draft.description.trim() || null;
  }
  if (draft.category !== snap.category) patch.category = draft.category;
  if (draft.priority !== snap.priority) patch.priority = draft.priority;
  if (draft.coverageDecision !== snap.coverageDecision) {
    patch.coverageDecision = draft.coverageDecision ? draft.coverageDecision : null;
  }
  if (draft.billable !== snap.billable) patch.billable = draft.billable;
  if (draft.assignedTo !== snap.assignedTo) {
    patch.assignedTo = draft.assignedTo ? draft.assignedTo : null;
  }
  if (draft.productId !== snap.productId) {
    patch.productId = draft.productId ? draft.productId : null;
  }
  if (draft.contactId !== snap.contactId) {
    patch.contactId = draft.contactId ? draft.contactId : null;
  }
  return patch;
}
