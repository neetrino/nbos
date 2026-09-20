'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FUNCTION_CATALOG_MODULE } from '@nbos/shared';
import { PageHero, SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/components/shared';
import { usePermission } from '@/lib/permissions';
import { CreateFunctionDraftForm } from './create-function-draft-form';
import { FunctionCatalogBrowser } from './function-catalog-browser';
import { FunctionCatalogDetailSheet } from './function-catalog-detail-sheet';
import { FUNCTION_CATALOG_ALL_ID } from './function-catalog.constants';
import { isCatalogRailId, type CatalogRailId } from './function-catalog-grouping';
import { useFunctionCatalogQuery } from './use-function-catalog-query';

export function FunctionCatalogPage() {
  const t = useTranslations('hr.functionCatalog');
  const { can } = usePermission();
  const canEdit = can('ADD', FUNCTION_CATALOG_MODULE) || can('EDIT', FUNCTION_CATALOG_MODULE);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const [selectedCategory, setSelectedCategory] = useState<CatalogRailId>(FUNCTION_CATALOG_ALL_ID);
  const [openId, setOpenId] = useState<string | null>(null);
  const catalog = useFunctionCatalogQuery({ search: debouncedSearch });
  const selected = useMemo(
    () => catalog.items.find((item) => item.id === openId) ?? null,
    [catalog.items, openId],
  );

  return (
    <div className="space-y-6">
      <PageHero title={t('title')} />
      <CatalogPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        canEdit={canEdit}
        onCreated={() => void catalog.reload()}
      />
      <FunctionCatalogBrowser
        items={catalog.items}
        loading={catalog.loading}
        error={catalog.error}
        onRetry={() => void catalog.reload()}
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onSelectCategory={(id) => {
          if (isCatalogRailId(id)) setSelectedCategory(id);
        }}
        unitsByFunctionId={catalog.unitsByFunctionId}
        salePriceByFunctionId={catalog.salePriceByFunctionId}
        mode={{ kind: 'browse', showStatus: canEdit, onOpen: setOpenId }}
      />
      <FunctionCatalogDetailSheet
        item={selected}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </div>
  );
}

function CatalogPageHeader({
  title,
  subtitle,
  canEdit,
  onCreated,
}: {
  title: string;
  subtitle: string;
  canEdit: boolean;
  onCreated: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm">{subtitle}</p>
      </div>
      {canEdit ? <CreateFunctionDraftForm onCreated={onCreated} /> : null}
    </div>
  );
}
