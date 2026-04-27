'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCcw, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import { CompanySheet } from '@/features/clients/components/CompanySheet';
import { CreateCompanyDialog } from '@/features/clients/components/CreateCompanyDialog';
import {
  COMPANY_TYPES,
  TAX_STATUSES,
  getCompanyType,
  getTaxStatus,
} from '@/features/clients/constants/clients';
import { companiesApi, type Company } from '@/lib/api/clients';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    await companiesApi.create(data);
    await fetchCompanies();
  };

  const handleDelete = async (id: string) => {
    await companiesApi.delete(id);
    setSheetOpen(false);
    setSelectedCompany(null);
    await fetchCompanies();
  };

  const handleRowClick = (company: Company) => {
    setSelectedCompany(company);
    setSheetOpen(true);
  };

  const filterConfigs = [
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
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Companies" description={`${companies.length} companies`}>
        <Button variant="outline" size="icon" onClick={fetchCompanies}>
          <RefreshCcw size={16} />
        </Button>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Company
        </Button>
      </PageHeader>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, tax ID..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
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
        onOpenChange={setSheetOpen}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
