'use client';

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  useModuleHeroSlots,
  IntegratedSearchFilters,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  DeleteConfirmDialog,
  useDeleteConfirm,
} from '@/components/shared';
import { CompanySheet } from '@/features/clients/components/CompanySheet';
import { CreateCompanyDialog } from '@/features/clients/components/CreateCompanyDialog';
import {
  COMPANY_TYPES,
  TAX_STATUSES,
  getCompanyType,
  getTaxStatus,
} from '@/features/clients/constants/clients';
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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const deleteConfirm = useDeleteConfirm();

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await companiesApi.getAll({
        pageSize: 100,
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
  }, [search, filters]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCompanyId = searchParams.get(OPEN_COMPANY_QUERY);
  const deepLinkCompanyAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    deepLinkCompanyAttemptedRef.current = null;
  }, [openCompanyId]);

  const stripOpenCompanyFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(OPEN_COMPANY_QUERY)) return;
    params.delete(OPEN_COMPANY_QUERY);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

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

  const handleDelete = async (id: string) => {
    await companiesApi.delete(id);
    setSheetOpen(false);
    setSelectedCompany(null);
    stripOpenCompanyFromUrl();
    await fetchCompanies();
  };

  const handleRowClick = (company: Company) => {
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
      trailing: (
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} aria-hidden />
          New Company
        </Button>
      ),
    }),
    [filterConfigs, filters, search],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full flex-col gap-5">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchCompanies} />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add your first company to get started"
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Create First Company
            </Button>
          }
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tax Status</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Primary Contact</TableHead>
                <TableHead className="text-center">Projects</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => {
                const compType = getCompanyType(company.type);
                const taxSt = getTaxStatus(company.taxStatus);
                return (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(company)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                          <Building2 size={16} />
                        </div>
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {compType && (
                        <StatusBadge label={compType.label} variant={compType.variant} />
                      )}
                    </TableCell>
                    <TableCell>
                      {taxSt && <StatusBadge label={taxSt.label} variant={taxSt.variant} />}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {company.taxId ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <User size={12} className="text-muted-foreground" />
                        <span>
                          {company.contact.firstName} {company.contact.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {company._count.projects}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      {company._count.invoices}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
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
        onDelete={(id) => {
          const company =
            selectedCompany?.id === id ? selectedCompany : companies.find((item) => item.id === id);
          if (!company) return;
          deleteConfirm.request({ id, name: company.name });
        }}
      />

      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Delete company?"
        description="The company will be removed from the directory."
        onConfirm={() => {
          const id = deleteConfirm.target?.id;
          if (!id) return;
          deleteConfirm.clear();
          void handleDelete(id);
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
