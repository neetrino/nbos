'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { credentialsApi } from '@/lib/api/credentials';
import {
  productsApi,
  type ProductAccessSlotBindMeta,
  type ProductAccessSlotRow,
} from '@/lib/api/products';
import { UNIVERSAL_ACCESS_SLOT_KEY } from '@nbos/shared';
import { toast } from 'sonner';

function toastBindSuccess(slotKey: string, meta: ProductAccessSlotBindMeta | undefined) {
  if (
    meta &&
    meta.requestedSlotKey === UNIVERSAL_ACCESS_SLOT_KEY &&
    meta.effectiveSlotKey !== UNIVERSAL_ACCESS_SLOT_KEY
  ) {
    toast.success(`Saved under: ${meta.effectiveSlotLabel}`);
    return;
  }
  if (slotKey === UNIVERSAL_ACCESS_SLOT_KEY) {
    toast.success('Linked to Other / not listed');
    return;
  }
  toast.success('Linked to slot');
}

function toastCreateAndBindSuccess(meta: ProductAccessSlotBindMeta | undefined) {
  if (
    meta &&
    meta.requestedSlotKey === UNIVERSAL_ACCESS_SLOT_KEY &&
    meta.effectiveSlotKey !== UNIVERSAL_ACCESS_SLOT_KEY
  ) {
    toast.success(`Saved to Credentials — filed under ${meta.effectiveSlotLabel}`);
    return;
  }
  toast.success('Saved to Credentials and linked');
}

interface PickAccessSlotCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  productId: string;
  slot: ProductAccessSlotRow;
  /** Credentials already linked to any access slot on this product (one credential = one slot). */
  excludedCredentialIds: string[];
  onBound: () => void;
}

export function PickAccessSlotCredentialDialog({
  open,
  onOpenChange,
  projectId,
  productId,
  slot,
  excludedCredentialIds,
  onBound,
}: PickAccessSlotCredentialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<
    Array<{ id: string; name: string; category: string; login: string | null }>
  >([]);

  const excluded = useMemo(() => new Set(excludedCredentialIds), [excludedCredentialIds]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await credentialsApi.getAll({ projectId, pageSize: 100 });
      const allowed = new Set(slot.allowedCategories);
      setItems(
        res.items
          .filter((c) => allowed.has(c.category))
          .filter((c) => !excluded.has(c.id))
          .map((c) => ({ id: c.id, name: c.name, category: c.category, login: c.login })),
      );
    } catch {
      toast.error('Could not load credentials.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, slot.allowedCategories, excluded]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function pick(credentialId: string) {
    try {
      const res = await productsApi.bindAccessSlot(productId, {
        slotKey: slot.slotKey,
        credentialId,
      });
      toastBindSuccess(slot.slotKey, res.bindMeta);
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
  return (
    <CredentialFormSheet
      open={open}
      onOpenChange={onOpenChange}
      vaultScope="project"
      projectId={projectId}
      productId={productId}
      title={`New credential — ${slot.label}`}
      initialName={slot.label}
      allowedCategories={slot.allowedCategories}
      initialCredentialType={slot.defaultCredentialType ?? 'LOGIN_PASSWORD'}
      submitLabel="Save & link"
      successToast={false}
      presetKey={slot.slotKey}
      onCreated={async (created) => {
        try {
          const res = await productsApi.bindAccessSlot(productId, {
            slotKey: slot.slotKey,
            credentialId: created.id,
          });
          toastCreateAndBindSuccess(res.bindMeta);
          onBound();
        } catch {
          toast.error('Credential was created but could not be linked to this slot.');
          onBound();
        }
      }}
    />
  );
}
