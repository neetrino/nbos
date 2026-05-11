'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  FolderKanban,
  Shield,
  Lock,
  Building2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import type { StatusVariant } from '@/components/shared/StatusBadge';
import {
  CREDENTIAL_CATEGORIES,
  ACCESS_LEVELS,
  getAccessLevel,
  getCredentialCriticality,
} from '@/features/credentials/constants/credentials';
import { CreateCredentialDialog } from '@/features/credentials/components/CreateCredentialDialog';
import { CredentialDetailDialog } from '@/features/credentials/components/CredentialDetailDialog';
import { EditCredentialDialog } from '@/features/credentials/components/EditCredentialDialog';
import { DeleteCredentialDialog } from '@/features/credentials/components/DeleteCredentialDialog';
import { PermanentDeleteCredentialDialog } from '@/features/credentials/components/PermanentDeleteCredentialDialog';
import { credentialsApi } from '@/lib/api/credentials';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';

type CredentialTab = 'all' | 'personal' | 'department' | 'secret';
type VaultListScope = 'active' | 'archived';

interface CredentialListItem {
  id: string;
  name: string;
  category: string;
  credentialType: string;
  criticality: string;
  environment: string | null;
  provider: string | null;
  url: string | null;
  login: string | null;
  phone: string | null;
  accessLevel: string;
  allowedEmployees: string[];
  project: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  nextRotationAt?: string | null;
  health?: {
    status: 'HEALTHY' | 'DUE_SOON' | 'OVERDUE' | 'UNKNOWN';
    dueInDays: number | null;
    flags: string[];
  };
  secretsPresent?: {
    password: boolean;
    apiKey: boolean;
    envData: boolean;
    secureNotes: boolean;
  };
}

function credentialHealthBadge(
  health?: CredentialListItem['health'],
): { label: string; variant: StatusVariant } | null {
  if (!health) return null;
  if (health.status === 'OVERDUE') return { label: 'Overdue', variant: 'red' };
  if (health.status === 'DUE_SOON') return { label: 'Due soon', variant: 'amber' };
  if (health.status === 'HEALTHY') return { label: 'Healthy', variant: 'green' };
  return { label: 'Unknown', variant: 'default' };
}

const TAB_CONFIG: { value: CredentialTab; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <KeyRound size={14} /> },
  { value: 'personal', label: 'Personal', icon: <User size={14} /> },
  { value: 'department', label: 'Department', icon: <Building2 size={14} /> },
  { value: 'secret', label: 'Secret', icon: <Lock size={14} /> },
];

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [visibleLogins, setVisibleLogins] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<CredentialTab>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailCredentialId, setDetailCredentialId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editCredentialId, setEditCredentialId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<{ id: string; name: string } | null>(null);
  const [vaultListScope, setVaultListScope] = useState<VaultListScope>('active');

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    try {
      const data = await credentialsApi.getAll({
        pageSize: 200,
        search: search || undefined,
        category: filters.category && filters.category !== 'all' ? filters.category : undefined,
        accessLevel:
          filters.accessLevel && filters.accessLevel !== 'all' ? filters.accessLevel : undefined,
        tab: activeTab,
        includeArchived: vaultListScope === 'archived',
      });
      setCredentials((data.items as unknown as CredentialListItem[]) ?? []);
    } catch {
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, [search, filters, activeTab, vaultListScope]);

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
    toast.success('Copied');
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
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
        <PermissionGate module="CREDENTIALS" action="ADD">
          <Button onClick={() => setCreateOpen(true)} disabled={vaultListScope === 'archived'}>
            <Plus size={16} />
            New Credential
          </Button>
        </PermissionGate>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CredentialTab)}>
        <TabsList>
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, provider..."
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onClearFilters={() => setFilters({})}
          />
        </div>

        {TAB_CONFIG.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <CredentialTable
              credentials={credentials}
              loading={loading}
              listScope={vaultListScope}
              visibleLogins={visibleLogins}
              onToggleLogin={toggleLogin}
              onCopy={copyToClipboard}
              onCreateOpen={() => setCreateOpen(true)}
              onOpenVault={(id) => {
                setDetailCredentialId(id);
                setDetailOpen(true);
              }}
              onOpenEdit={(id) => {
                setEditCredentialId(id);
                setEditOpen(true);
              }}
              onRequestDelete={(id, name) => setDeleteTarget({ id, name })}
              onRequestPurge={(id, name) => setPurgeTarget({ id, name })}
              onRestored={fetchCredentials}
            />
          </TabsContent>
        ))}
      </Tabs>

      <CreateCredentialDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void fetchCredentials();
        }}
      />

      <CredentialDetailDialog
        credentialId={detailCredentialId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailCredentialId(null);
        }}
      />

      <EditCredentialDialog
        credentialId={editCredentialId}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditCredentialId(null);
        }}
        onSaved={fetchCredentials}
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

function CredentialTable({
  credentials,
  loading,
  listScope,
  visibleLogins,
  onToggleLogin,
  onCopy,
  onCreateOpen,
  onOpenVault,
  onOpenEdit,
  onRequestDelete,
  onRequestPurge,
  onRestored,
}: {
  credentials: CredentialListItem[];
  loading: boolean;
  listScope: VaultListScope;
  visibleLogins: Set<string>;
  onToggleLogin: (id: string) => void;
  onCopy: (text: string) => void;
  onCreateOpen: () => void;
  onOpenVault: (id: string) => void;
  onOpenEdit: (id: string) => void;
  onRequestDelete: (id: string, name: string) => void;
  onRequestPurge: (id: string, name: string) => void;
  onRestored: () => void;
}) {
  const isArchivedList = listScope === 'archived';
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <EmptyState
        icon={KeyRound}
        title="No credentials"
        description="No credentials match the current filters"
        action={
          <PermissionGate module="CREDENTIALS" action="ADD">
            <Button onClick={onCreateOpen}>
              <Plus size={16} /> Add Credential
            </Button>
          </PermissionGate>
        }
      />
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Rotation</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="w-28 text-center">Actions</TableHead>
            <TableHead className="w-24 text-right">Vault</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.map((cred) => {
            const access = getAccessLevel(cred.accessLevel);
            const criticality = getCredentialCriticality(cred.criticality);
            const healthBadge = credentialHealthBadge(cred.health);
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
                <TableCell className="text-muted-foreground text-xs">
                  {cred.credentialType.replaceAll('_', ' ')}
                </TableCell>
                <TableCell>
                  {criticality && (
                    <StatusBadge label={criticality.label} variant={criticality.variant} />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {cred.provider ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
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
                            onToggleLogin(cred.id);
                          }}
                        >
                          {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopy(cred.login!);
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
                <TableCell className="text-muted-foreground text-sm">
                  {cred.owner ? `${cred.owner.firstName} ${cred.owner.lastName}` : '—'}
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
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">
                      {cred.nextRotationAt
                        ? new Date(cred.nextRotationAt).toLocaleDateString()
                        : 'No date'}
                    </span>
                    {healthBadge && (
                      <StatusBadge label={healthBadge.label} variant={healthBadge.variant} />
                    )}
                    {!!cred.health?.flags?.length && (
                      <span className="text-muted-foreground text-[10px]">
                        {cred.health.flags.join(', ')}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {cred.url && !isArchivedList ? (
                    <Button
                      type="button"
                      variant="link"
                      className="text-accent h-auto gap-1 p-0 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        void (async () => {
                          try {
                            const { url } = await credentialsApi.recordUrlOpened(cred.id);
                            window.open(url, '_blank', 'noopener,noreferrer');
                          } catch {
                            toast.error('Could not open URL');
                          }
                        })();
                      }}
                    >
                      <ExternalLink size={10} />
                      Open
                    </Button>
                  ) : cred.url && isArchivedList ? (
                    <span className="text-muted-foreground text-xs break-all">{cred.url}</span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {isArchivedList ? (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <PermissionGate module="CREDENTIALS" action="EDIT">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            void (async () => {
                              try {
                                await credentialsApi.restore(cred.id);
                                toast.success('Credential restored');
                                onRestored();
                              } catch {
                                toast.error('Could not restore');
                              }
                            })();
                          }}
                        >
                          <RotateCcw size={12} />
                          Restore
                        </Button>
                      </PermissionGate>
                      <PermissionGate module="CREDENTIALS" action="DELETE">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/40 hover:bg-destructive/10 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestPurge(cred.id, cred.name);
                          }}
                        >
                          Erase
                        </Button>
                      </PermissionGate>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-0.5">
                      <PermissionGate module="CREDENTIALS" action="EDIT">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Edit credential"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEdit(cred.id);
                          }}
                        >
                          <Pencil size={12} />
                        </Button>
                      </PermissionGate>
                      <PermissionGate module="CREDENTIALS" action="DELETE">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Archive credential"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRequestDelete(cred.id, cred.name);
                          }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </PermissionGate>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!isArchivedList && (
                    <PermissionGate module="CREDENTIALS" action="VIEW">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Open vault detail"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenVault(cred.id);
                        }}
                      >
                        <Shield size={12} />
                      </Button>
                    </PermissionGate>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
