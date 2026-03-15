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
import { credentialsApi } from '@/lib/api/credentials';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { PermissionGate } from '@/lib/permissions';
import { toast } from 'sonner';

type CredentialTab = 'all' | 'personal' | 'department' | 'secret';

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
      });
      setCredentials((data.items as unknown as CredentialListItem[]) ?? []);
    } catch {
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, [search, filters, activeTab]);

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
        <Button variant="outline" size="icon" onClick={fetchCredentials}>
          <RefreshCcw size={16} />
        </Button>
        <PermissionGate module="CREDENTIALS" action="ADD">
          <Button onClick={() => setCreateOpen(true)}>
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
              visibleLogins={visibleLogins}
              onToggleLogin={toggleLogin}
              onCopy={copyToClipboard}
              onCreateOpen={() => setCreateOpen(true)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <CreateCredentialDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchCredentials}
      />
    </div>
  );
}

function CredentialTable({
  credentials,
  loading,
  visibleLogins,
  onToggleLogin,
  onCopy,
  onCreateOpen,
}: {
  credentials: CredentialListItem[];
  loading: boolean;
  visibleLogins: Set<string>;
  onToggleLogin: (id: string) => void;
  onCopy: (text: string) => void;
  onCreateOpen: () => void;
}) {
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
              <Select value={category} onValueChange={setCategory}>
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
              <Select value={accessLevel} onValueChange={setAccessLevel}>
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
