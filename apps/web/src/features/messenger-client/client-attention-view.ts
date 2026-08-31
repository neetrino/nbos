export type ClientAttentionRow = {
  productId: string;
  purpose: 'WORK' | 'FINANCE';
  productName?: string;
  ownerKind: 'EMPLOYEE' | 'QUEUE' | 'ROLE';
  ownerQueue: 'SUPPORT_INTAKE' | 'FINANCE' | null;
  label: string;
  isManual: boolean;
};

export function attentionScopeKey(row: ClientAttentionRow): string {
  return `${row.productId}:${row.purpose}`;
}

export function attentionScopeLabel(row: ClientAttentionRow): string {
  const name = row.productName?.trim() || row.productId;
  return `${name} · ${row.purpose}`;
}

export function uniqueAttentionLabels(attention: ClientAttentionRow[] | undefined): string {
  const labels = [...new Set((attention ?? []).map((row) => row.label).filter(Boolean))];
  return labels.join(' · ');
}

export function viewedAttention(
  attention: ClientAttentionRow[] | undefined,
  productId: string | null,
): ClientAttentionRow | undefined {
  if (!attention?.length) return undefined;
  if (productId) {
    const match = attention.filter((row) => row.productId === productId);
    if (match.length === 1) return match[0];
    if (match.length > 1) return match[0];
  }
  if (attention.length === 1) return attention[0];
  return attention[0];
}
