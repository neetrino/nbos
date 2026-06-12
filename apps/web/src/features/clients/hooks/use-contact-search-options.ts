'use client';

import { useCallback } from 'react';
import { contactsApi } from '@/lib/api/clients';

export function useContactSearchOptions() {
  return useCallback(async (query: string) => {
    const res = await contactsApi.getAll({
      pageSize: 25,
      scope: 'active',
      search: query.trim() || undefined,
    });
    return res.items.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}`.trim(),
      subtitle: [c.phone, c.email].filter(Boolean).join(' · ') || undefined,
    }));
  }, []);
}
