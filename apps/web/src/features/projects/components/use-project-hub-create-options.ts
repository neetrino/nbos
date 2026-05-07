'use client';

import { useEffect, useState } from 'react';
import { companiesApi, contactsApi, type Company, type Contact } from '@/lib/api/clients';

export function useProjectHubCreateOptions(open: boolean) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setOptionsLoading(true);
      setLoadError(null);
      void Promise.all([
        contactsApi.getAll({ pageSize: 200 }),
        companiesApi.getAll({ pageSize: 200 }),
      ])
        .then(([cRes, coRes]) => {
          if (!cancelled) {
            setContacts(cRes.items);
            setCompanies(coRes.items);
          }
        })
        .catch(() => {
          if (!cancelled) setLoadError('Could not load contacts or companies.');
        })
        .finally(() => {
          if (!cancelled) setOptionsLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return { contacts, companies, optionsLoading, loadError, setLoadError };
}
