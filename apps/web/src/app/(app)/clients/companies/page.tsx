'use client';

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NAVIGABLE_ENTITY_CARD_GRID_CLASS,
  DeleteConfirmDialog,
  useDeleteConfirm,
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { CompanyCard } from '@/features/clients/components/CompanyCard';
import { CompanySheet } from '@/features/clients/components/CompanySheet';
import { CompaniesTable } from '@/features/clients/components/CompaniesTable';
import { CreateCompanyDialog } from '@/features/clients/components/CreateCompanyDialog';
import {
  CLIENTS_DIRECTORY_VIEW_OPTIONS,
  type ClientsDirectoryViewMode,
} from '@/features/clients/constants/clients-directory-view-options';
import { COMPANY_TYPES, TAX_STATUSES } from '@/features/clients/constants/clients';
import { ClientsDirectorySettingsSheet } from '@/features/clients/components/clients-directory-settings-sheet';
import { ClientsDirectoryTrashBanner } from '@/features/clients/components/clients-directory-trash-banner';
import { useListScope } from '@/hooks/use-list-scope';
import { companiesApi, type Company } from '@/lib/api/clients';
import { toast } from 'sonner';

const OPEN_COMPANY_QUERY = 'openId';

function CompaniesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<ClientsDirectoryViewMode>('grid');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const deleteConfirm = useDeleteConfirm();

  const stripOpenCompanyFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(OPEN_COMPANY_QUERY)) return;
    params.delete(OPEN_COMPANY_QUERY);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const { scope, setScope, isTrashView } = useListScope({
    onScopeChange: () => {
      setSheetOpen(false);
      setSelectedCompany(null);
      stripOpenCompanyFromUrl();
    },
  });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await companiesApi.getAll({
        pageSize: 100,
        scope,
        search: search || undefined,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
        taxStatus: filters.taxStatus && filters.taxStatus !== 'all' ? filters.taxStatus : undefined,
      });
      setCompanies(data.items);
      setError(null);
    } catch {
      setError('Companies could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters, scope]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCompanyId = searchParams.get(OPEN_COMPANY_QUERY);
  const deepLinkCompanyAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    deepLinkCompanyAttemptedRef.current = null;
  }, [openCompanyId]);

  const pushOpenCompanyToUrl = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_COMPANY_QUERY, id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!openCompanyId || loading) return;
    const match = companies.find((c) => c.id === openCompanyId);
    if (match) {
      setSelectedCompany(match);
      setSheetOpen(true);
      return;
    }
    if (deepLinkCompanyAttemptedRef.current === openCompanyId) return;
    deepLinkCompanyAttemptedRef.current = openCompanyId;
    let cancelled = false;
    void (async () => {
      try {
        const company = await companiesApi.getById(openCompanyId);
        if (cancelled) return;
        setCompanies((prev) => (prev.some((c) => c.id === company.id) ? prev : [company, ...prev]));
        setSelectedCompany(company);
        setSheetOpen(true);
      } catch {
        if (!cancelled) {
          toast.error('Company not found or you cannot open it.');
          stripOpenCompanyFromUrl();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openCompanyId, loading, companies, stripOpenCompanyFromUrl]);

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    const updated = await companiesApi.update(id, data);
    setSelectedCompany(updated);
    await fetchCompanies();
  };

  const handleMoveToTrash = async (id: string) => {
    await companiesApi.moveToTrash(id);
    toast.success('Company moved to Trash');
    setSheetOpen(false);
    setSelectedCompany(null);
    stripOpenCompanyFromUrl();
    await fetchCompanies();
  };

  const handleRestore = async (id: string) => {
    const restored = await companiesApi.restore(id);
    toast.success('Company restored');
    setSelectedCompany(restored);
    await fetchCompanies();
  };

  const handleRowClick = (company: Company) => {
    setSelectedCompany(company);
    setSheetOpen(true);
    pushOpenCompanyToUrl(company.id);
  };

  const filterConfigs = useMemo(
    () => [
      {
        key: 'type',
        label: 'Type',
        options: COMPANY_TYPES.map((t) => ({ value: t.value, label: t.label })),
      },
      {
        key: 'taxStatus',
        label: 'Tax Status',
        options: TAX_STATUSES.map((s) => ({ value: s.value, label: s.label })),
      },
    ],
    [],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, tax ID…"
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={(key: string, value: string) =>
            setFilters((prev) => ({ ...prev, [key]: value }))
          }
          onClearAll={() => setFilters({})}
        />
      ),
      viewMode: (
        <ViewModeSwitch value={view} onChange={setView} options={CLIENTS_DIRECTORY_VIEW_OPTIONS} />
      ),
      trailing: (
        <div className="flex items-center gap-2">
          <ClientsDirectorySettingsSheet
            listScope={scope}
            onListScopeChange={setScope}
            entityLabel="companies"
          />
          {!isTrashView ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} aria-hidden />
              New Company
            </Button>
          ) : null}
        </div>
      ),
    }),
    [filterConfigs, filters, isTrashView, scope, search, setScope, view],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full flex-col gap-5">
      {isTrashView ? (
        <ClientsDirectoryTrashBanner
          entityLabel="companies"
          onBackToActive={() => setScope('active')}
        />
      ) : null}
      {loading ? (
        <LoadingState
          variant={view === 'grid' ? 'cards' : 'list'}
          count={view === 'grid' ? 6 : 5}
        />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchCompanies} />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={isTrashView ? 'Trash is empty' : 'No companies yet'}
          description={
            isTrashView
              ? 'Removed companies will appear here until restored or purged.'
              : 'Add your first company to get started'
          }
          action={
            isTrashView ? undefined : (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} />
                Create First Company
              </Button>
            )
          }
        />
      ) : view === 'grid' ? (
        <div className={NAVIGABLE_ENTITY_CARD_GRID_CLASS}>
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} onOpen={handleRowClick} />
          ))}
        </div>
      ) : (
        <CompaniesTable companies={companies} onOpen={handleRowClick} />
      )}

      <CreateCompanyDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={fetchCompanies}
      />

      <CompanySheet
        company={selectedCompany}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedCompany(null);
            stripOpenCompanyFromUrl();
          }
        }}
        onUpdate={handleUpdate}
        isTrashView={isTrashView}
        onMoveToTrash={
          isTrashView
            ? undefined
            : (id) => {
                const company =
                  selectedCompany?.id === id
                    ? selectedCompany
                    : companies.find((item) => item.id === id);
                if (!company) return;
                deleteConfirm.request({ id, name: company.name });
              }
        }
        onRestore={isTrashView ? (id) => void handleRestore(id) : undefined}
      />

      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Move company to Trash?"
        description="The company will be removed from active lists. You can restore it from Trash later."
        onConfirm={() => {
          const id = deleteConfirm.target?.id;
          if (!id) return;
          deleteConfirm.clear();
          void handleMoveToTrash(id);
        }}
      />
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CompaniesPageContent />
    </Suspense>
  );
}
