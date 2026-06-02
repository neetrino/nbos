'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, KeyRound, FolderKanban, Lock, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHero,
  PageHeroTabs,
  IntegratedSearchFilters,
  ViewModeSwitch,
  type PageHeroTabOption,
} from '@/components/shared';
import {
  CREDENTIAL_CATEGORIES,
  ACCESS_LEVELS,
  CREDENTIAL_TYPES,
} from '@/features/credentials/constants/credentials';
import {
  CREDENTIAL_VAULT_PAGE_SIZE,
  CREDENTIAL_VAULT_VIEW_OPTIONS,
  type CredentialQuickFilterKey,
  type CredentialVaultViewMode,
} from '@/features/credentials/constants/credential-vault';
import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { CredentialQuickFilterChips } from '@/features/credentials/components/credential-quick-filter-chips';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { CredentialVaultCategoryBoard } from '@/features/credentials/components/credential-vault-category-board';
import { CredentialVaultPagination } from '@/features/credentials/components/credential-vault-pagination';
import {
  CredentialVaultTable,
  type VaultListScope,
} from '@/features/credentials/components/credential-vault-table';
import { CREDENTIAL_VAULT_COPY_FEEDBACK_MS } from '@/features/credentials/constants/credential-vault-copy';
import { CredentialVaultTiles } from '@/features/credentials/components/credential-vault-tiles';
import { DeleteCredentialDialog } from '@/features/credentials/components/DeleteCredentialDialog';
import { PermanentDeleteCredentialDialog } from '@/features/credentials/components/PermanentDeleteCredentialDialog';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { quickCategoryChipsForVaultScope } from '@/features/credentials/constants/credential-vault-categories';
import {
  canCreateInVaultScope,
  type CredentialVaultScope,
  vaultScopeToListTab,
} from '@/features/credentials/vault-scope';
import { credentialsApi } from '@/lib/api/credentials';
import { PermissionGate, usePermission } from '@/lib/permissions';
import { toast } from 'sonner';

const CREDENTIAL_TAB_OPTIONS: PageHeroTabOption<CredentialVaultScope>[] = [
  { value: 'all', label: 'All', icon: KeyRound },
  { value: 'my', label: 'My', icon: User },
  { value: 'team', label: 'Team', icon: Users },
  { value: 'project', label: 'Project', icon: FolderKanban },
  { value: 'secret', label: 'Secret', icon: Lock },
];

export default function CredentialsPage() {
  const { me } = usePermission();
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [quickCategory, setQuickCategory] = useState<string | null>(null);
  const [quickFilters, setQuickFilters] = useState<Set<CredentialQuickFilterKey>>(new Set());
  const [viewMode, setViewMode] = useState<CredentialVaultViewMode>('list');
  const [visibleLogins, setVisibleLogins] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<CredentialVaultScope>('all');
  const [vaultListScope, setVaultListScope] = useState<VaultListScope>('active');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCredentialId, setSheetCredentialId] = useState<string | null>(null);
  const [createPresetCategory, setCreatePresetCategory] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<{ id: string; name: string } | null>(null);
  const [tileCopyCredentialId, setTileCopyCredentialId] = useState<string | null>(null);
  const [passwordFlashCredentialId, setPasswordFlashCredentialId] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const category =
        quickCategory ??
        (filters.category && filters.category !== 'all' ? filters.category : undefined);
      const data = await credentialsApi.getAll({
        page,
        pageSize: CREDENTIAL_VAULT_PAGE_SIZE,
        search: search || undefined,
        category,
        credentialType:
          filters.credentialType && filters.credentialType !== 'all'
            ? filters.credentialType
            : undefined,
        accessLevel:
          activeTab === 'all' && filters.accessLevel && filters.accessLevel !== 'all'
            ? filters.accessLevel
            : undefined,
        ownerId: activeTab === 'all' && quickFilters.has('mine') && me?.id ? me.id : undefined,
        needsRotation: quickFilters.has('needsRotation') ? true : undefined,
        tab: vaultListScope === 'archived' ? undefined : vaultScopeToListTab(activeTab),
        includeArchived: vaultListScope === 'archived',
      });
      setCredentials((data.items as unknown as CredentialListItem[]) ?? []);
      setTotalPages(data.meta.totalPages);
      setTotal(data.meta.total);
    } catch {
      setCredentials([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, filters, quickCategory, quickFilters, activeTab, vaultListScope, page, me?.id]);

  useEffect(() => {
    setPage(1);
  }, [search, filters, quickCategory, quickFilters, activeTab, vaultListScope]);

  useEffect(() => {
    void fetchCredentials();
  }, [fetchCredentials]);

  const openCreate = (category?: string) => {
    setCreatePresetCategory(category);
    setSheetCredentialId(null);
    setSheetOpen(true);
  };

  const openCredential = (id: string) => {
    setSheetCredentialId(id);
    setSheetOpen(true);
  };

  const toggleLogin = (id: string) => {
    setVisibleLogins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const toggleQuickFilter = (key: CredentialQuickFilterKey) => {
    setQuickFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const quickCategoryChips = useMemo(() => quickCategoryChipsForVaultScope(activeTab), [activeTab]);

  const filterConfigs = useMemo(() => {
    const base = [
      {
        key: 'category',
        label: 'Category',
        options: CREDENTIAL_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
      },
      {
        key: 'credentialType',
        label: 'Type',
        options: CREDENTIAL_TYPES.map((t) => ({ value: t.value, label: t.label })),
      },
    ];
    if (activeTab !== 'all') return base;
    return [
      ...base,
      {
        key: 'accessLevel',
        label: 'Access type',
        options: ACCESS_LEVELS.map((l) => ({ value: l.value, label: l.label })),
      },
    ];
  }, [activeTab]);

  const handleTabChange = (tab: CredentialVaultScope) => {
    setActiveTab(tab);
    setQuickCategory(null);
    if (tab !== 'all') {
      setFilters((prev) => {
        const next = { ...prev };
        delete next.accessLevel;
        return next;
      });
      setQuickFilters((prev) => {
        const next = new Set(prev);
        next.delete('mine');
        return next;
      });
    }
  };

  const showCreate = vaultListScope === 'active' && canCreateInVaultScope(activeTab);

  const vaultView = (() => {
    if (viewMode === 'tiles') {
      return (
        <CredentialVaultTiles
          credentials={credentials}
          loading={loading}
          showCreate={showCreate}
          onCreateOpen={() => openCreate()}
          onOpenCredential={openCredential}
          onCopyLogin={copyToClipboard}
          onCopyPassword={(id) => setTileCopyCredentialId(id)}
          passwordFlashCredentialId={passwordFlashCredentialId}
        />
      );
    }
    if (viewMode === 'category-board') {
      return (
        <CredentialVaultCategoryBoard
          credentials={credentials}
          loading={loading}
          vaultScope={activeTab}
          showCreate={showCreate}
          categoryColumns={quickCategoryChips}
          onCreateInCategory={(cat) => openCreate(cat)}
          onOpenCredential={openCredential}
          onCopyLogin={copyToClipboard}
          onCopyPassword={(id) => setTileCopyCredentialId(id)}
          passwordFlashCredentialId={passwordFlashCredentialId}
        />
      );
    }
    return (
      <CredentialVaultTable
        credentials={credentials}
        loading={loading}
        listScope={vaultListScope}
        visibleLogins={visibleLogins}
        onToggleLogin={toggleLogin}
        onCopy={copyToClipboard}
        onCreateOpen={() => openCreate()}
        onOpenCredential={openCredential}
        onRequestDelete={(id, name) => setDeleteTarget({ id, name })}
        onRequestPurge={(id, name) => setPurgeTarget({ id, name })}
        onRestored={fetchCredentials}
        showCreate={showCreate}
      />
    );
  })();

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Credentials Vault"
        tabs={
          <PageHeroTabs
            value={activeTab}
            onChange={handleTabChange}
            options={CREDENTIAL_TAB_OPTIONS}
            ariaLabel="Credential scope"
          />
        }
        search={
          <IntegratedSearchFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, provider…"
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onClearAll={() => {
              setFilters({});
              setQuickCategory(null);
              setQuickFilters(new Set());
            }}
          />
        }
        viewMode={
          <ViewModeSwitch
            value={viewMode}
            onChange={setViewMode}
            options={CREDENTIAL_VAULT_VIEW_OPTIONS}
          />
        }
        trailing={
          <>
            <span className="text-muted-foreground hidden text-xs tabular-nums sm:inline">
              {total} credentials
            </span>
            <Button
              type="button"
              variant={vaultListScope === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVaultListScope('active')}
            >
              Active
            </Button>
            <Button
              type="button"
              variant={vaultListScope === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVaultListScope('archived')}
            >
              Archived
            </Button>
            {showCreate && (
              <PermissionGate module="CREDENTIALS" action="ADD">
                <Button type="button" onClick={() => openCreate()}>
                  <Plus size={16} aria-hidden />
                  New Credential
                </Button>
              </PermissionGate>
            )}
          </>
        }
      />

      <CredentialQuickFilterChips
        vaultScope={activeTab}
        categoryChips={quickCategoryChips}
        activeCategory={quickCategory}
        onCategoryChange={setQuickCategory}
        activeQuick={quickFilters}
        onToggleQuick={toggleQuickFilter}
      />

      <div className={viewMode === 'category-board' ? 'flex min-h-0 flex-1 flex-col' : undefined}>
        {vaultView}
      </div>

      <CredentialVaultPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      <CredentialFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSheetCredentialId(null);
            setCreatePresetCategory(undefined);
          }
        }}
        credentialId={sheetCredentialId}
        vaultScope={activeTab}
        initialCategory={createPresetCategory}
        presetKey={`${createPresetCategory ?? ''}-${activeTab}`}
        onSaved={fetchCredentials}
        onRequestArchive={(id, name) => {
          setSheetOpen(false);
          setDeleteTarget({ id, name });
        }}
      />

      <CredentialStepUpDialog
        open={tileCopyCredentialId !== null}
        onOpenChange={(open) => {
          if (!open) setTileCopyCredentialId(null);
        }}
        title="Confirm to copy password"
        onConfirm={async (pwd) => {
          if (!tileCopyCredentialId) return;
          const flashId = tileCopyCredentialId;
          const { value } = await credentialsApi.copySecret(flashId, 'password', pwd);
          await navigator.clipboard.writeText(value);
          toast.success('Password copied');
          setTileCopyCredentialId(null);
          setPasswordFlashCredentialId(flashId);
          window.setTimeout(() => {
            setPasswordFlashCredentialId((current) => (current === flashId ? null : current));
          }, CREDENTIAL_VAULT_COPY_FEEDBACK_MS);
        }}
      />

      <DeleteCredentialDialog
        credentialId={deleteTarget?.id ?? null}
        credentialName={deleteTarget?.name ?? null}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={fetchCredentials}
      />

      <PermanentDeleteCredentialDialog
        credentialId={purgeTarget?.id ?? null}
        credentialName={purgeTarget?.name ?? null}
        open={purgeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
        onDeleted={fetchCredentials}
      />
    </div>
  );
}
