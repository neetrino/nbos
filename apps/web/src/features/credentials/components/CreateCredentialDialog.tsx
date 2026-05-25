'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NbosDatePicker } from '@/components/shared/date-picker';
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
import { credentialsApi, type CredentialDetail } from '@/lib/api/credentials';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { toast } from 'sonner';

const CREATE_DEFAULT_SUCCESS_TOAST = 'Credential created';

export interface CreateCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (credential: CredentialDetail) => void;
  /** When set, credential is scoped to this project (e.g. from product delivery). */
  projectId?: string;
  productId?: string;
  title?: string;
  initialName?: string;
  initialCategory?: string;
  /** Restrict category options; if one value, category is fixed. */
  allowedCategories?: string[];
  initialCredentialType?: string;
  submitLabel?: string;
  /** `false` skips success toast; string overrides default message. */
  successToast?: string | false;
  /** When this value changes while the dialog is open, the form resets (e.g. access slot key). */
  presetKey?: string;
}

function emptyFormDefaults() {
  return {
    name: '',
    category: 'SERVICE',
    credentialType: 'LOGIN_PASSWORD',
    criticality: 'MEDIUM',
    environment: '',
    provider: '',
    url: '',
    login: '',
    password: '',
    apiKey: '',
    envData: '',
    accessLevel: 'PROJECT_TEAM',
    publicNotes: '',
    secureNotes: '',
    nextRotationAt: '',
    allowedEmployees: [] as string[],
  };
}

export function CreateCredentialDialog({
  open,
  onOpenChange,
  onCreated,
  projectId,
  productId,
  title = 'New Credential',
  initialName,
  initialCategory,
  allowedCategories,
  initialCredentialType,
  submitLabel = 'Create',
  successToast,
  presetKey = '',
}: CreateCredentialDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SERVICE');
  const [credentialType, setCredentialType] = useState('LOGIN_PASSWORD');
  const [criticality, setCriticality] = useState('MEDIUM');
  const [environment, setEnvironment] = useState('');
  const [provider, setProvider] = useState('');
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [envData, setEnvData] = useState('');
  const [accessLevel, setAccessLevel] = useState('PROJECT_TEAM');
  const [publicNotes, setPublicNotes] = useState('');
  const [secureNotes, setSecureNotes] = useState('');
  const [nextRotationAt, setNextRotationAt] = useState('');
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allowedEmployees, setAllowedEmployees] = useState<string[]>([]);

  const resetFromProps = useCallback(() => {
    const d = emptyFormDefaults();
    const allowedList = allowedCategories?.length ? allowedCategories : undefined;
    const options = allowedList?.length
      ? CREDENTIAL_CATEGORIES.filter((c) => allowedList.includes(c.value))
      : CREDENTIAL_CATEGORIES;
    const locked = options.length === 1;
    const nextCategory =
      (locked ? options[0]?.value : undefined) ??
      initialCategory ??
      options[0]?.value ??
      d.category;

    setName(initialName ?? d.name);
    setCategory(nextCategory);
    setCredentialType(initialCredentialType ?? d.credentialType);
    setCriticality(d.criticality);
    setEnvironment(d.environment);
    setProvider(d.provider);
    setUrl(d.url);
    setLogin(d.login);
    setPassword(d.password);
    setApiKey(d.apiKey);
    setEnvData(d.envData);
    setAccessLevel(d.accessLevel);
    setPublicNotes(d.publicNotes);
    setSecureNotes(d.secureNotes);
    setNextRotationAt(d.nextRotationAt);
    setAllowedEmployees(d.allowedEmployees);
  }, [allowedCategories, initialCategory, initialCredentialType, initialName]);

  const prevOpenRef = useRef(false);
  const prevPresetKeyRef = useRef(presetKey);
  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      return;
    }
    const openingNow = !prevOpenRef.current;
    const presetChanged = prevPresetKeyRef.current !== presetKey;
    if (openingNow || presetChanged) {
      resetFromProps();
    }
    prevOpenRef.current = true;
    prevPresetKeyRef.current = presetKey;
  }, [open, presetKey, resetFromProps]);

  useEffect(() => {
    if (open && accessLevel === 'SECRET') {
      void employeesApi.getAll({ pageSize: 200 }).then((r) => setEmployees(r.items));
    }
  }, [open, accessLevel]);

  const categorySelectOptions = allowedCategories?.length
    ? CREDENTIAL_CATEGORIES.filter((c) => allowedCategories.includes(c.value))
    : CREDENTIAL_CATEGORIES;
  const categoryLocked = categorySelectOptions.length === 1;
  const categoryLabel = CREDENTIAL_CATEGORIES.find((c) => c.value === category)?.label ?? category;

  const handleCreate = async () => {
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
        environment: environment.trim() || undefined,
        provider: provider.trim() || undefined,
        url: url.trim() || undefined,
        login: login.trim() || undefined,
        password: password.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        envData: envData.trim() || undefined,
        accessLevel,
        publicNotes: publicNotes.trim() || undefined,
        secureNotes: secureNotes.trim() || undefined,
        nextRotationAt: nextRotationAt || undefined,
        allowedEmployees: accessLevel === 'SECRET' ? allowedEmployees : undefined,
      };
      if (projectId) body.projectId = projectId;
      if (productId) body.productId = productId;

      const created = await credentialsApi.create(body);
      if (successToast !== false) {
        toast.success(successToast ?? CREATE_DEFAULT_SUCCESS_TOAST);
      }
      onOpenChange(false);
      onCreated(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
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
          <DialogTitle>{title}</DialogTitle>
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
              {categoryLocked ? (
                <Input
                  readOnly
                  disabled
                  value={categoryLabel}
                  className="bg-muted text-muted-foreground"
                  aria-label="Category (fixed for this slot)"
                />
              ) : (
                <Select value={category} onValueChange={(v) => setCategory(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorySelectOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Credential Type</Label>
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
            <Label htmlFor="cred-provider">Provider</Label>
            <Input
              id="cred-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. AWS, Vercel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cred-environment">Environment</Label>
              <Input
                id="cred-environment"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="Production, Staging..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cred-next-rotation">Next rotation</Label>
              <NbosDatePicker
                id="cred-next-rotation"
                value={nextRotationAt}
                onChange={setNextRotationAt}
                aria-label="Next rotation"
              />
            </div>
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
              value={publicNotes}
              onChange={(e) => setPublicNotes(e.target.value)}
              placeholder="Public non-secret notes..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cred-secure-notes">Secure notes</Label>
            <Textarea
              id="cred-secure-notes"
              autoComplete="off"
              value={secureNotes}
              onChange={(e) => setSecureNotes(e.target.value)}
              placeholder="Encrypted notes, recovery codes, private key notes..."
              className="font-mono text-xs"
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
          <Button onClick={() => void handleCreate()} disabled={saving}>
            {saving ? 'Creating...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
