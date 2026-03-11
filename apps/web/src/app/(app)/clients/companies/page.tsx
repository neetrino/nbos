'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Building2, RefreshCcw, User } from 'lucide-react';
import { companiesApi, type Company } from '@/lib/api/clients';

const TYPE_LABELS: Record<string, string> = {
  LEGAL: 'Legal Entity',
  INDIVIDUAL: 'Individual',
  SOLE_PROPRIETOR: 'Sole Proprietor',
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await companiesApi.getAll({
        pageSize: 50,
        search: search || undefined,
      });
      setCompanies(data.items);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Companies</h1>
          <p className="text-muted-foreground mt-1 text-sm">{companies.length} companies</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCompanies}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border p-2.5 transition-colors"
          >
            <RefreshCcw size={16} />
          </button>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
            <Plus size={16} />
            New Company
          </button>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies by name, tax ID..."
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : companies.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed py-20 text-center">
          <Building2 size={48} className="text-muted-foreground/30 mx-auto" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">No companies yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Add your first company to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <div
              key={company.id}
              className="border-border bg-card rounded-2xl border p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/5 text-primary rounded-xl p-2.5">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">{company.name}</h3>
                  <p className="text-muted-foreground text-xs">
                    {TYPE_LABELS[company.type] ?? company.type}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {company.taxId && (
                  <p className="text-muted-foreground text-xs">Tax ID: {company.taxId}</p>
                )}
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <User size={12} />
                  <span>
                    {company.contact.firstName} {company.contact.lastName}
                  </span>
                </div>
              </div>
              <div className="text-muted-foreground mt-4 flex items-center justify-between text-[10px]">
                <span
                  className={`rounded-md px-2 py-0.5 font-medium ${
                    company.taxStatus === 'TAX' ? 'bg-success/10 text-success' : 'bg-secondary'
                  }`}
                >
                  {company.taxStatus === 'TAX' ? 'Tax Payer' : 'Tax Free'}
                </span>
                <span>
                  {company._count.projects}P / {company._count.invoices}I
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
