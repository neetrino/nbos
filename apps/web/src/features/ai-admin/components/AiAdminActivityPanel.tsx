'use client';

import { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { EmptyState, ErrorState, ListPagination, LoadingState } from '@/components/shared';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { AI_ADMIN_PAGE_STACK_CLASS } from '../ai-admin-ui.constants';
import { EMPTY_ACTIVITY_META, type AiAdminActivityPageMeta } from '../activity';
import { AI_ADMIN_ACTIVITY_PAGE_SIZE } from '../constants';
import { AiAdminActivityList } from './AiAdminActivityList';
import { AiAdminSection } from './AiAdminSection';

export function AiAdminActivityPanel() {
  const [items, setItems] = useState<unknown[]>([]);
  const [meta, setMeta] = useState<AiAdminActivityPageMeta>(EMPTY_ACTIVITY_META);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    try {
      const result = await aiAdminApi.activity({
        page: nextPage,
        pageSize: AI_ADMIN_ACTIVITY_PAGE_SIZE,
      });
      setItems(result.items);
      setMeta({
        total: result.meta.total,
        page: result.meta.page,
        pageSize: result.meta.pageSize,
        totalPages: result.meta.totalPages,
      });
      setError(null);
    } catch {
      setError('AI activity could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  if (loading && items.length === 0) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => void load(page)} />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No AI activity"
        description="Lifecycle, grant, credential, and provider events will appear here."
      />
    );
  }
  return (
    <div className={AI_ADMIN_PAGE_STACK_CLASS}>
      <AiAdminSection icon={History} title="Recent AI Platform activity">
        <AiAdminActivityList items={items} />
        <ListPagination meta={meta} onPageChange={setPage} />
      </AiAdminSection>
    </div>
  );
}
