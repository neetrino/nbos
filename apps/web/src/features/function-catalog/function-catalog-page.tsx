'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryFunctionOperationalDto } from '@nbos/shared';
import { FUNCTION_CATALOG_MODULE } from '@nbos/shared';
import { PageHero } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { deliveryFunctionsApi } from '@/lib/api/delivery-functions';
import { usePermission } from '@/lib/permissions';
import { CreateFunctionDraftForm } from './create-function-draft-form';
import { FunctionCatalogCard } from './function-catalog-card';
import { FunctionInstructionSheet } from './function-instruction-sheet';

const STATUS_LABEL: Record<string, 'statusDraft' | 'statusActive' | 'statusArchived'> = {
  DRAFT: 'statusDraft',
  ACTIVE: 'statusActive',
  ARCHIVED: 'statusArchived',
};

export function FunctionCatalogPage() {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const canEdit = can('ADD', FUNCTION_CATALOG_MODULE) || can('EDIT', FUNCTION_CATALOG_MODULE);
  const [items, setItems] = useState<DeliveryFunctionOperationalDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setFailed(false);
        try {
          const items = await deliveryFunctionsApi.listAll({ search: search || undefined });
          setItems(items);
        } catch {
          setFailed(true);
          setItems([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 200);
    return () => window.clearTimeout(handle);
  }, [search, reloadToken]);

  const selected = useMemo(() => items.find((item) => item.id === openId) ?? null, [items, openId]);

  return (
    <div className="space-y-6">
      <PageHero title={t('title')} />
      <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('search')}
          className="sm:max-w-sm"
        />
        {canEdit ? (
          <CreateFunctionDraftForm onCreated={() => setReloadToken((value) => value + 1)} />
        ) : null}
      </div>
      {failed ? <p className="text-destructive text-sm">{t('loadFailed')}</p> : null}
      {!loading && !failed && items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <FunctionCatalogCard
            key={item.id}
            item={item}
            showStatus={canEdit}
            statusLabel={t(STATUS_LABEL[item.status] ?? 'statusDraft')}
            onOpen={setOpenId}
          />
        ))}
      </div>
      {selected ? (
        <div className="border-border bg-card rounded-2xl border p-5">
          <FunctionInstructionSheet item={selected} />
        </div>
      ) : null}
    </div>
  );
}
