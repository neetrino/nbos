'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { CREDENTIAL_CATEGORIES } from '@/features/credentials/constants/credentials';
import { credentialsApi } from '@/lib/api/credentials';
import { productsApi, type ProductAccessSlotRow } from '@/lib/api/products';
import { toast } from 'sonner';

interface PickAccessSlotCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  productId: string;
  slot: ProductAccessSlotRow;
  onBound: () => void;
}

export function PickAccessSlotCredentialDialog({
  open,
  onOpenChange,
  projectId,
  productId,
  slot,
  onBound,
}: PickAccessSlotCredentialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<
    Array<{ id: string; name: string; category: string; login: string | null }>
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await credentialsApi.getAll({ projectId, pageSize: 100 });
      const allowed = new Set(slot.allowedCategories);
      setItems(
        res.items
          .filter((c) => allowed.has(c.category))
          .map((c) => ({ id: c.id, name: c.name, category: c.category, login: c.login })),
      );
    } catch {
      toast.error('Could not load credentials.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, slot.allowedCategories]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function pick(credentialId: string) {
    try {
      await productsApi.bindAccessSlot(productId, { slotKey: slot.slotKey, credentialId });
      toast.success('Linked to slot');
      onOpenChange(false);
      onBound();
    } catch {
      toast.error('Could not link credential.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pick credential — {slot.label}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            No matching credentials in this project. Create one first.
          </p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {items.map((row) => (
              <li key={row.id}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start py-2 text-left"
                  onClick={() => void pick(row.id)}
                >
                  <span className="block w-full">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted-foreground block text-xs">
                      {row.category}
                      {row.login ? ` · ${row.login}` : ''}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CreateAccessSlotCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  productId: string;
  slot: ProductAccessSlotRow;
  onBound: () => void;
}

export function CreateAccessSlotCredentialDialog({
  open,
  onOpenChange,
  projectId,
  productId,
  slot,
  onBound,
}: CreateAccessSlotCredentialDialogProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(slot.allowedCategories[0] ?? 'SERVICE');
  const [url, setUrl] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) {
      setName(slot.label);
      setCategory(slot.allowedCategories[0] ?? 'SERVICE');
      setUrl('');
      setLogin('');
      setPassword('');
    }
  }, [open, slot]);

  const categoryOptions = CREDENTIAL_CATEGORIES.filter((c) =>
    slot.allowedCategories.includes(c.value),
  );

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const credentialType = slot.defaultCredentialType ?? 'LOGIN_PASSWORD';
      const created = await credentialsApi.create({
        projectId,
        productId,
        category,
        credentialType,
        criticality: 'MEDIUM',
        accessLevel: 'PROJECT_TEAM',
        name: name.trim(),
        url: url.trim() || undefined,
        login: login.trim() || undefined,
        password: password.trim() || undefined,
      });
      await productsApi.bindAccessSlot(productId, {
        slotKey: slot.slotKey,
        credentialId: created.id,
      });
      toast.success('Saved to Credentials and linked');
      onOpenChange(false);
      onBound();
    } catch {
      toast.error('Could not create credential. Check permissions.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New credential — {slot.label}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="slot-cred-name">Name</Label>
            <Input
              id="slot-cred-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9"
            />
          </div>
          {categoryOptions.length > 1 ? (
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? category)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="slot-cred-url">URL (optional)</Label>
            <Input
              id="slot-cred-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-9"
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slot-cred-login">Login (optional)</Label>
            <Input
              id="slot-cred-login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="h-9"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slot-cred-password">Password (optional)</Label>
            <Input
              id="slot-cred-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9"
              autoComplete="new-password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save & link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
