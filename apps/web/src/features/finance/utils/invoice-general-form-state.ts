import type { Invoice } from '@/lib/api/finance';

export type InvoiceGeneralDraft = {
  amount: string;
  taxStatus: string;
  companyId: string | null;
  projectId: string | null;
  orderComment: string | null;
};

export type UpdateInvoiceGeneralPayload = {
  amount?: number;
  taxStatus?: string;
  companyId?: string | null;
  projectId?: string | null;
  orderComment?: string | null;
};

export function createInvoiceGeneralDraft(invoice: Invoice): InvoiceGeneralDraft {
  return {
    amount: invoice.amount,
    taxStatus: invoice.taxStatus,
    companyId: invoice.companyId,
    projectId: invoice.projectId,
    orderComment: invoice.orderComment,
  };
}

function parseDraftAmount(raw: string): number | null {
  const amount = parseFloat(raw.replace(/\s/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function buildInvoiceGeneralPatch(
  snap: InvoiceGeneralDraft,
  draft: InvoiceGeneralDraft,
): UpdateInvoiceGeneralPayload {
  const out: UpdateInvoiceGeneralPayload = {};

  const amount = parseDraftAmount(draft.amount);
  const snapAmount = parseDraftAmount(snap.amount);
  if (amount != null && amount !== snapAmount) {
    out.amount = amount;
  }

  if (draft.taxStatus !== snap.taxStatus) {
    out.taxStatus = draft.taxStatus;
  }

  if (draft.companyId !== snap.companyId) {
    out.companyId = draft.companyId;
  }

  if (draft.projectId !== snap.projectId) {
    out.projectId = draft.projectId;
  }

  if (draft.orderComment !== snap.orderComment) {
    out.orderComment = draft.orderComment;
  }

  return out;
}

export function isInvoiceGeneralDirty(a: InvoiceGeneralDraft, b: InvoiceGeneralDraft): boolean {
  return (
    a.amount !== b.amount ||
    a.taxStatus !== b.taxStatus ||
    a.companyId !== b.companyId ||
    a.projectId !== b.projectId ||
    a.orderComment !== b.orderComment
  );
}
