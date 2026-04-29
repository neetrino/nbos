'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  RefreshCcw,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import {
  CREDENTIAL_CATEGORIES,
  ACCESS_LEVELS,
  getAccessLevel,
} from '@/features/credentials/constants/credentials';
import { CredentialDetailDialog } from '@/features/credentials/components/CredentialDetailDialog';
import { EditCredentialDialog } from '@/features/credentials/components/EditCredentialDialog';
import { DeleteCredentialDialog } from '@/features/credentials/components/DeleteCredentialDialog';
import { PermanentDeleteCredentialDialog } from '@/features/credentials/components/PermanentDeleteCredentialDialog';
import { credentialsApi } from '@/lib/api/credentials';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';

type CredentialTab = 'all' | 'personal' | 'department' | 'secret';
type VaultListScope = 'active' | 'archived';

interface CredentialListItem {
  id: string;
  name: string;
  category: string;
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
  secretsPresent?: {
    password: boolean;
    apiKey: boolean;
    envData: boolean;
  };
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
        <Button variant="outline" size="icon" onClick={fetchCredentials}>
          <RefreshCcw size={16} />
        </Button>
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
        onCreated={fetchCredentials}
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
            <TableHead>Provider</TableHead>
            <TableHead>Login</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="w-28 text-center">Actions</TableHead>
            <TableHead className="w-24 text-right">Vault</TableHead>
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

function CreateCredentialDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SERVICE');
  const [provider, setProvider] = useState('');
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [envData, setEnvData] = useState('');
  const [accessLevel, setAccessLevel] = useState('PROJECT_TEAM');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allowedEmployees, setAllowedEmployees] = useState<string[]>([]);

  useEffect(() => {
    if (open && accessLevel === 'SECRET') {
      employeesApi.getAll({ pageSize: 200 }).then((d) => setEmployees(d.items));
    }
  }, [open, accessLevel]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await credentialsApi.create({
        name: name.trim(),
        category,
        provider: provider.trim() || undefined,
        url: url.trim() || undefined,
        login: login.trim() || undefined,
        password: password.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        envData: envData.trim() || undefined,
        accessLevel,
        notes: notes.trim() || undefined,
        allowedEmployees: accessLevel === 'SECRET' ? allowedEmployees : undefined,
      });
      toast.success('Credential created');
      onOpenChange(false);
      resetForm();
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('SERVICE');
    setProvider('');
    setUrl('');
    setLogin('');
    setPassword('');
    setApiKey('');
    setEnvData('');
    setAccessLevel('PROJECT_TEAM');
    setNotes('');
    setAllowedEmployees([]);
  };

  const toggleEmployee = (id: string) => {
    setAllowedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Credential</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cred-name">Name *</Label>
            <Input
              id="cred-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production DB"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? '')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREDENTIAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Access Level</Label>
              <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v ?? '')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cred-provider">Provider</Label>
            <Input
              id="cred-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. AWS, Vercel"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cred-url">URL</Label>
            <Input
              id="cred-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cred-login">Login</Label>
              <Input
                id="cred-login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="username or email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cred-password">Password</Label>
              <Input
                id="cred-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cred-apikey">API key</Label>
            <Input
              id="cred-apikey"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Optional — stored encrypted"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cred-env">Environment data</Label>
            <Textarea
              id="cred-env"
              autoComplete="off"
              value={envData}
              onChange={(e) => setEnvData(e.target.value)}
              placeholder="Optional KEY=value lines — stored encrypted"
              className="font-mono text-xs"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cred-notes">Notes</Label>
            <Input
              id="cred-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional info..."
            />
          </div>

          {accessLevel === 'SECRET' && (
            <div className="grid gap-2">
              <Label>Allowed Employees ({allowedEmployees.length} selected)</Label>
              <div className="border-border max-h-40 overflow-y-auto rounded-md border p-2">
                {employees.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Loading employees...</p>
                ) : (
                  employees.map((emp) => (
                    <label
                      key={emp.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={allowedEmployees.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        className="accent-primary"
                      />
                      {emp.firstName} {emp.lastName}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
