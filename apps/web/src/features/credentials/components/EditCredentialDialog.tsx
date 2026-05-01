'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  ACCESS_LEVELS,
  CREDENTIAL_CATEGORIES,
  CREDENTIAL_CRITICALITIES,
  CREDENTIAL_TYPES,
} from '@/features/credentials/constants/credentials';
import {
  credentialsApi,
  type CredentialDetail,
  type CredentialSecretsPresent,
} from '@/lib/api/credentials';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { toast } from 'sonner';

export interface EditCredentialDialogProps {
  credentialId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditCredentialDialog({
  credentialId,
  open,
  onOpenChange,
  onSaved,
}: EditCredentialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SERVICE');
  const [credentialType, setCredentialType] = useState('LOGIN_PASSWORD');
  const [criticality, setCriticality] = useState('MEDIUM');
  const [environment, setEnvironment] = useState('');
  const [provider, setProvider] = useState('');
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [envData, setEnvData] = useState('');
  const [secureNotes, setSecureNotes] = useState('');
  const [secretsPresent, setSecretsPresent] = useState<CredentialSecretsPresent | null>(null);
  const [accessLevel, setAccessLevel] = useState('PROJECT_TEAM');
  const [publicNotes, setPublicNotes] = useState('');
  const [nextRotationAt, setNextRotationAt] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allowedEmployees, setAllowedEmployees] = useState<string[]>([]);

  const applyDetail = useCallback((d: CredentialDetail) => {
    setName(d.name);
    setCategory(d.category);
    setCredentialType(d.credentialType);
    setCriticality(d.criticality);
    setEnvironment(d.environment ?? '');
    setProvider(d.provider ?? '');
    setUrl(d.url ?? '');
    setLogin(d.login ?? '');
    setPhone(d.phone ?? '');
    setPassword('');
    setApiKey('');
    setEnvData('');
    setSecureNotes('');
    setSecretsPresent(d.secretsPresent);
    setAccessLevel(d.accessLevel);
    setPublicNotes(d.publicNotes ?? d.notes ?? '');
    setNextRotationAt(d.nextRotationAt?.slice(0, 10) ?? '');
    setAllowedEmployees([...d.allowedEmployees]);
  }, []);

  const load = useCallback(async () => {
    if (!credentialId) return;
    setLoading(true);
    try {
      const d = await credentialsApi.getById(credentialId);
      applyDetail(d);
    } catch {
      toast.error('Failed to load credential');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [credentialId, applyDetail, onOpenChange]);

  useEffect(() => {
    if (open && credentialId) void load();
  }, [open, credentialId, load]);

  useEffect(() => {
    if (open && accessLevel === 'SECRET') {
      void employeesApi.getAll({ pageSize: 200 }).then((r) => setEmployees(r.items));
    }
  }, [open, accessLevel]);

  const toggleEmployee = (id: string) => {
    setAllowedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!credentialId) return;
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        category,
        credentialType,
        criticality,
        environment: environment.trim() || null,
        provider: provider.trim() || null,
        url: url.trim() || null,
        login: login.trim() || null,
        phone: phone.trim() || null,
        publicNotes: publicNotes.trim() || null,
        nextRotationAt: nextRotationAt || null,
        accessLevel,
        allowedEmployees: accessLevel === 'SECRET' ? allowedEmployees : [],
      };
      if (password.trim()) {
        body.password = password.trim();
      }
      if (apiKey.trim()) {
        body.apiKey = apiKey.trim();
      }
      if (envData.trim()) {
        body.envData = envData.trim();
      }
      if (secureNotes.trim()) {
        body.secureNotes = secureNotes.trim();
      }
      await credentialsApi.update(credentialId, body);
      toast.success('Credential updated');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit credential</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-10 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-cred-name">Name *</Label>
              <Input
                id="edit-cred-name"
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
                <Label>Access level</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Credential type</Label>
                <Select value={credentialType} onValueChange={(v) => setCredentialType(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREDENTIAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Criticality</Label>
                <Select value={criticality} onValueChange={(v) => setCriticality(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREDENTIAL_CRITICALITIES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-cred-provider">Provider</Label>
              <Input
                id="edit-cred-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. AWS, Vercel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-cred-environment">Environment</Label>
                <Input
                  id="edit-cred-environment"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  placeholder="Production, Staging..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cred-next-rotation">Next rotation</Label>
                <Input
                  id="edit-cred-next-rotation"
                  type="date"
                  value={nextRotationAt}
                  onChange={(e) => setNextRotationAt(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-cred-url">URL</Label>
              <Input
                id="edit-cred-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-cred-login">Login</Label>
                <Input
                  id="edit-cred-login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="username or email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cred-phone">Phone</Label>
                <Input
                  id="edit-cred-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-cred-password">New password</Label>
              <Input
                id="edit-cred-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-cred-apikey">New API key</Label>
              <Input
                id="edit-cred-apikey"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  secretsPresent?.apiKey
                    ? 'Leave blank to keep current stored key'
                    : 'Optional — stored encrypted'
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-cred-env">New environment data</Label>
              <Textarea
                id="edit-cred-env"
                autoComplete="off"
                value={envData}
                onChange={(e) => setEnvData(e.target.value)}
                placeholder={
                  secretsPresent?.envData
                    ? 'Leave blank to keep current stored value'
                    : 'Optional KEY=value lines — stored encrypted'
                }
                className="font-mono text-xs"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-cred-notes">Notes</Label>
              <Input
                id="edit-cred-notes"
                value={publicNotes}
                onChange={(e) => setPublicNotes(e.target.value)}
                placeholder="Public non-secret notes..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-cred-secure-notes">New secure notes</Label>
              <Textarea
                id="edit-cred-secure-notes"
                autoComplete="off"
                value={secureNotes}
                onChange={(e) => setSecureNotes(e.target.value)}
                placeholder={
                  secretsPresent?.secureNotes
                    ? 'Leave blank to keep current encrypted secure notes'
                    : 'Optional encrypted notes'
                }
                className="font-mono text-xs"
              />
            </div>

            {accessLevel === 'SECRET' && (
              <div className="grid gap-2">
                <Label>Allowed employees ({allowedEmployees.length} selected)</Label>
                <div className="border-border max-h-40 overflow-y-auto rounded-md border p-2">
                  {employees.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Loading employees…</p>
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
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
