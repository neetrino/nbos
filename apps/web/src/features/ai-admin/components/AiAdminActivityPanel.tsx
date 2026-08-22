'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { EmptyState, ErrorState, ListPagination, LoadingState } from '@/components/shared';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { EMPTY_ACTIVITY_META, type AiAdminActivityPageMeta } from '../activity';
import { AI_ADMIN_ACTIVITY_PAGE_SIZE } from '../constants';
import { AiAdminActivityList } from './AiAdminActivityList';

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
        icon={Activity}
        title="No AI activity"
        description="Lifecycle, grant, credential, and provider events will appear here."
      />
    );
  }
  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <h2 className="mb-3 text-sm font-semibold">Recent AI Platform activity</h2>
      <AiAdminActivityList items={items} />
      <ListPagination meta={meta} onPageChange={setPage} />
    </section>
  );
}
