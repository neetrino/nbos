'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  messengerClientApi,
  type MessengerClientConversationRow,
} from '@/lib/api/messenger-core-client';
import {
  PORTFOLIO_CLIENT_COMPANY_QUERY,
  PORTFOLIO_CLIENT_CONTACT_QUERY,
} from './client-messenger.constants';

export type PortfolioClientTarget = {
  contactId?: string;
  companyId?: string;
  label?: string;
};

export function usePortfolioTargetFromLocation(): PortfolioClientTarget | null {
  const params = useSearchParams();
  const contactId = params.get(PORTFOLIO_CLIENT_CONTACT_QUERY)?.trim() || undefined;
  const companyId = params.get(PORTFOLIO_CLIENT_COMPANY_QUERY)?.trim() || undefined;
  return useMemo(() => {
    if (contactId && !companyId) return { contactId };
    if (companyId && !contactId) return { companyId };
    return null;
  }, [companyId, contactId]);
}

export function usePortfolioClientScope(target: PortfolioClientTarget | null) {
  const scope = useQuery({
    queryKey: portfolioScopeQueryKey(target),
    enabled: target != null,
    queryFn: () => loadPortfolioScope(target),
  });
  const ids = scope.data?.conversationIds ?? [];
  const rows = useQuery({
    queryKey: ['messenger', 'client', 'portfolio-scope-rows', ids] as const,
    enabled: target != null && scope.isSuccess,
    queryFn: () => loadPortfolioScopeRows(ids),
  });
  return {
    label: scope.data?.label ?? target?.label ?? 'this client',
    uniqueConversationId: scope.data?.uniqueConversationId ?? null,
    rows: rows.data ?? [],
    loading: Boolean(target) && (scope.isPending || (scope.isSuccess && rows.isPending)),
    error: Boolean(target) && (scope.isError || rows.isError),
    empty: scope.isSuccess && ids.length === 0,
  };
}

export function portfolioScopeEmptyCopy(label: string): string {
  return `No client conversation is linked to ${label}.`;
}

function portfolioScopeQueryKey(target: PortfolioClientTarget | null) {
  return [
    'messenger',
    'client',
    'portfolio-scope',
    target?.contactId ?? '',
    target?.companyId ?? '',
  ] as const;
}

async function loadPortfolioScope(target: PortfolioClientTarget | null) {
  if (!target) throw new Error('Portfolio scope is missing');
  return messengerClientApi.portfolioScope({
    contactId: target.contactId,
    companyId: target.companyId,
  });
}

async function loadPortfolioScopeRows(ids: string[]): Promise<MessengerClientConversationRow[]> {
  if (ids.length === 0) return [];
  const settled = await Promise.allSettled(ids.map((id) => messengerClientApi.getConversation(id)));
  return settled.flatMap((row) => (row.status === 'fulfilled' ? [row.value] : []));
}
