'use client';

import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { contactsApi } from '@/lib/api/clients';
import { dealsApi } from '@/lib/api/deals';
import { leadsApi } from '@/lib/api/leads';
import { projectsApi } from '@/lib/api/projects';
import { getApiErrorMessage } from '@/lib/api-errors';
import { LEAD_SVYAZAT_RECENT_LIMIT } from './lead-svyazat-labels';
import {
  toContactHits,
  toLeadHits,
  toOpenDealHits,
  toProjectHits,
  type SvyazatSearchHit,
  type SvyazatSearchKind,
} from './lead-svyazat-search';

export type { SvyazatSearchKind };

const LIST_PAGE_SIZE = 15;

export function useSvyazatEntitySearch(
  open: boolean,
  kind: SvyazatSearchKind,
  excludeLeadId?: string,
) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SvyazatSearchHit[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHits([]);
      setSelectedId(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await loadSvyazatHits(kind, debouncedQuery, excludeLeadId);
        if (!cancelled) setHits(next);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not search.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, kind, debouncedQuery, excludeLeadId]);

  return { query, setQuery, hits, selectedId, setSelectedId, loading, error, setError };
}

async function loadSvyazatHits(
  kind: SvyazatSearchKind,
  search: string,
  excludeLeadId?: string,
): Promise<SvyazatSearchHit[]> {
  const q = search || undefined;
  if (kind === 'contact') {
    const data = await contactsApi.getAll({
      pageSize: LEAD_SVYAZAT_RECENT_LIMIT,
      scope: 'active',
      search: q,
    });
    return toContactHits(data.items);
  }
  if (kind === 'deal') {
    const data = await dealsApi.getAll({
      pageSize: LIST_PAGE_SIZE,
      scope: 'active',
      search: q,
    });
    return toOpenDealHits(data.items);
  }
  if (kind === 'project') {
    const data = await projectsApi.getAll({
      pageSize: LEAD_SVYAZAT_RECENT_LIMIT,
      scope: 'active',
      search: q,
    });
    return toProjectHits(data.items);
  }
  const data = await leadsApi.getAll({
    pageSize: LIST_PAGE_SIZE,
    scope: 'active',
    search: q,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  return toLeadHits(data.items, excludeLeadId ?? '');
}
