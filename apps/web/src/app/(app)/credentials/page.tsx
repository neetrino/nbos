'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  FolderKanban,
  Shield,
} from 'lucide-react';
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
import {
  CREDENTIAL_CATEGORIES,
  ACCESS_LEVELS,
  getAccessLevel,
} from '@/features/credentials/constants/credentials';
import { api } from '@/lib/api';

interface Credential {
  id: string;
  name: string;
  category: string;
  provider: string | null;
  url: string | null;
  login: string | null;
  accessLevel: string;
  project: { id: string; name: string } | null;
  createdAt: string;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [visibleLogins, setVisibleLogins] = useState<Set<string>>(new Set());

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get('/api/credentials', {
        params: {
          pageSize: 200,
          search: search || undefined,
          category: filters.category && filters.category !== 'all' ? filters.category : undefined,
        },
      });
      setCredentials(resp.data.items ?? resp.data ?? []);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const toggleLogin = (id: string) => {
    setVisibleLogins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filterConfigs = [
    {
      key: 'category',
      label: 'Category',
      options: CREDENTIAL_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    },
    {
      key: 'accessLevel',
      label: 'Access',
      options: ACCESS_LEVELS.map((l) => ({ value: l.value, label: l.label })),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Credentials Vault" description={`${credentials.length} credentials`}>
        <Button variant="outline" size="icon" onClick={fetchCredentials}>
          <RefreshCcw size={16} />
        </Button>
        <Button>
          <Plus size={16} />
          New Credential
        </Button>
      </PageHeader>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, provider..."
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
      ) : credentials.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No credentials yet"
          description="Store passwords and API keys securely"
          action={
            <Button>
              <Plus size={16} /> Add First Credential
            </Button>
          }
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((cred) => {
                const access = getAccessLevel(cred.accessLevel);
                const isVisible = visibleLogins.has(cred.id);
                return (
                  <TableRow key={cred.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <KeyRound size={14} className="text-muted-foreground" />
                        <span className="font-medium">{cred.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{cred.category}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {cred.provider ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs">
                          {cred.login ? (isVisible ? cred.login : '••••••••') : '—'}
                        </span>
                        {cred.login && (
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLogin(cred.id);
                              }}
                            >
                              {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(cred.login!);
                              }}
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {access && (
                        <div className="flex items-center gap-1">
                          <Shield size={11} className="text-muted-foreground" />
                          <StatusBadge label={access.label} variant={access.variant} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {cred.project ? (
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <FolderKanban size={10} />
                          {cred.project.name}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {cred.url ? (
                        <a
                          href={cred.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent flex items-center gap-1 text-xs hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={10} />
                          Open
                        </a>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
