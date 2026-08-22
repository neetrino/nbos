export interface AgentCollectionMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export interface AgentResponseBody {
  data: unknown;
  meta?: AgentCollectionMeta;
}

/**
 * Normalizes a gateway result into the `09` contract shape: `{ data, meta }`
 * for a page, `{ data }` for a single record or a bounded array.
 *
 * Purely structural. It never adds, hides or reshapes fields the capability
 * handler produced, so the authorization-aware projection stays authoritative.
 */
export function toAgentResponseBody(data: unknown): AgentResponseBody {
  const page = readPagedResult(data);
  if (page) {
    return { data: page.items, meta: page.meta };
  }
  return { data: data ?? null };
}

function readPagedResult(data: unknown): { items: unknown[]; meta: AgentCollectionMeta } | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  if (!Array.isArray(record.items)) return null;
  const meta = readMeta(record.meta);
  return meta ? { items: record.items, meta } : null;
}

function readMeta(value: unknown): AgentCollectionMeta | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.page !== 'number' ||
    typeof record.pageSize !== 'number' ||
    typeof record.total !== 'number'
  ) {
    return null;
  }
  const meta: AgentCollectionMeta = {
    page: record.page,
    pageSize: record.pageSize,
    total: record.total,
  };
  if (typeof record.totalPages === 'number') {
    meta.totalPages = record.totalPages;
  }
  return meta;
}
