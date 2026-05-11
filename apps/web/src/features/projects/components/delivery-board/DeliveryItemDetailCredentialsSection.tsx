'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PermissionGate } from '@/lib/permissions';
import { CREDENTIAL_CATEGORIES } from '@/features/credentials/constants/credentials';
import { credentialsApi, type CredentialDetail } from '@/lib/api/credentials';
import { toast } from 'sonner';

const DEFAULT_CATEGORY = 'SERVICE';

interface DeliveryItemDetailCredentialsSectionProps {
  projectId: string;
  productId: string;
  productCredentialsHref: string;
  onCreated: () => void;
}

export function DeliveryItemDetailCredentialsSection({
  projectId,
  productId,
  productCredentialsHref,
  onCreated,
}: DeliveryItemDetailCredentialsSectionProps) {
  const [items, setItems] = useState<CredentialDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Delivery access');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const load = useCallback(async () => {
    if (!projectId.trim()) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await credentialsApi.getAll({ projectId, pageSize: 100 });
      const scoped = res.items.filter((row) => row.productId === productId);
      setItems(scoped);
    } catch {
      toast.error('Could not load credentials for this project.');
    } finally {
      setLoading(false);
    }
  }, [projectId, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!projectId.trim()) {
      toast.error('Project context is missing; reopen from the board.');
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Enter a short name for this credential.');
      return;
    }
    setSaving(true);
    try {
      await credentialsApi.create({
        projectId,
        productId,
        category,
        credentialType: 'LOGIN_PASSWORD',
        criticality: 'MEDIUM',
        accessLevel: 'PROJECT_TEAM',
        name: trimmedName,
        url: url.trim() || undefined,
        login: login.trim() || undefined,
        password: password || undefined,
      });
      setPassword('');
      setLogin('');
      setUrl('');
      setName('Delivery access');
      toast.success('Saved to Credentials and linked to this product.');
      await load();
      onCreated();
    } catch {
      toast.error('Could not save credential. Check permissions (Credentials → Add).');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border-border bg-card/40 rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase">
          <KeyRound size={14} className="opacity-70" aria-hidden />
          Access & credentials
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={productCredentialsHref}
            className="text-primary text-xs font-medium hover:underline"
          >
            Product credentials →
          </Link>
          <Link href="/credentials" className="text-muted-foreground text-xs hover:underline">
            All credentials
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-4 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground mb-4 text-sm">No credentials linked to this product.</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {items.map((row) => (
            <li
              key={row.id}
              className="border-border bg-background/60 flex flex-wrap items-baseline justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="font-medium">{row.name}</span>
              <span className="text-muted-foreground text-xs">
                {row.login ? `Login: ${row.login}` : 'No login stored'}
                {row.url ? ` · ${row.url}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      <PermissionGate module="CREDENTIALS" action="ADD">
        <div className="border-border space-y-3 border-t pt-4">
          <p className="text-muted-foreground text-xs">
            New records are stored in the Credentials module and scoped to this project and product.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="delivery-cred-name" className="text-xs">
                Label
              </Label>
              <Input
                id="delivery-cred-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shopify admin"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? DEFAULT_CATEGORY)}>
                <SelectTrigger className="h-9 text-sm">
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
            <div className="space-y-1.5">
              <Label htmlFor="delivery-cred-url" className="text-xs">
                URL (optional)
              </Label>
              <Input
                id="delivery-cred-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery-cred-login" className="text-xs">
                Login
              </Label>
              <Input
                id="delivery-cred-login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="off"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery-cred-password" className="text-xs">
                Password
              </Label>
              <Input
                id="delivery-cred-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={saving}
            onClick={() => void handleCreate()}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus size={16} />}
            Save to Credentials
          </Button>
        </div>
      </PermissionGate>
    </section>
  );
}
