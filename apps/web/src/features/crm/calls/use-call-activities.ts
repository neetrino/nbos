'use client';

import { useEffect, useState } from 'react';
import { callsApi, type CallActivity } from '@/lib/api/calls';

const CALL_ACTIVITY_PAGE_SIZE = 50;

export const CALL_ACTIVITIES_LOAD_FAILED_KEY = 'calls.loadActivitiesFailed';

export type CallActivityScope =
  | { parent: 'lead'; id: string }
  | { parent: 'contact'; id: string }
  | { parent: 'deal'; id: string };

export function useCallActivities(scope: CallActivityScope) {
  const [items, setItems] = useState<CallActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const { parent, id } = scope;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const query =
          parent === 'lead'
            ? { leadId: id }
            : parent === 'contact'
              ? { contactId: id }
              : { dealId: id };
        const data = await callsApi.list({ ...query, page: 1, pageSize: CALL_ACTIVITY_PAGE_SIZE });
        if (cancelled) return;
        setItems(data.items);
        setErrorKey(null);
      } catch {
        if (cancelled) return;
        setItems([]);
        setErrorKey(CALL_ACTIVITIES_LOAD_FAILED_KEY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, parent]);

  return { items, loading, errorKey };
}
