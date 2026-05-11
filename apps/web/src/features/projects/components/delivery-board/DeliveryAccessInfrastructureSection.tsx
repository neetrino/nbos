'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Asterisk, ChevronRight, KeyRound, Loader2, Plus, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/lib/permissions';
import { CredentialDetailDialog } from '@/features/credentials/components/CredentialDetailDialog';
import { EditCredentialDialog } from '@/features/credentials/components/EditCredentialDialog';
import { productsApi, type ProductAccessSlotRow } from '@/lib/api/products';
import { toast } from 'sonner';
import {
  CreateAccessSlotCredentialDialog,
  PickAccessSlotCredentialDialog,
} from './delivery-access-slot-dialogs';

interface DeliveryAccessInfrastructureSectionProps {
  projectId: string;
  productId: string;
  productCredentialsHref: string;
  onRefreshDetail: () => void;
}

export function DeliveryAccessInfrastructureSection({
  projectId,
  productId,
  productCredentialsHref,
  onRefreshDetail,
}: DeliveryAccessInfrastructureSectionProps) {
  const [slots, setSlots] = useState<ProductAccessSlotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [pickSlot, setPickSlot] = useState<ProductAccessSlotRow | null>(null);
  const [createSlot, setCreateSlot] = useState<ProductAccessSlotRow | null>(null);

  const load = useCallback(async () => {
    if (!productId.trim()) {
      setSlots([]);
      return;
    }
    setLoading(true);
    try {
      const res = await productsApi.getAccessSlots(productId);
      setSlots(res.slots);
    } catch {
      toast.error('Could not load access slots.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUnbind(slotKey: string) {
    if (!window.confirm('Remove link from this slot? The credential stays in the vault.')) {
      return;
    }
    try {
      await productsApi.unbindAccessSlot(productId, slotKey);
      toast.success('Link removed');
      await load();
      onRefreshDetail();
    } catch {
      toast.error('Could not remove link.');
    }
  }

  if (!productId.trim()) {
    return null;
  }

  return (
    <section className="border-border bg-card/40 rounded-xl border p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase">
          <KeyRound size={14} className="opacity-70" aria-hidden />
          Access & infrastructure
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
        <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading…
        </div>
      ) : slots.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No access slots are configured for this product profile.
        </p>
      ) : (
        <ul className="space-y-2">
          {slots.map((slot) => (
            <li
              key={slot.slotKey}
              className="border-border bg-background/60 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                {slot.required ? (
                  <span title="Required for this product type" className="shrink-0 text-amber-600">
                    <Asterisk size={14} strokeWidth={2.5} aria-hidden />
                  </span>
                ) : (
                  <span className="w-3.5 shrink-0" aria-hidden />
                )}
                <span className="text-sm font-medium">{slot.label}</span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                {slot.boundCredential ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 max-w-[14rem] gap-1 px-2"
                      onClick={() => setDetailId(slot.boundCredential!.id)}
                    >
                      <span className="truncate text-sm font-medium">
                        {slot.boundCredential.name}
                      </span>
                      <ChevronRight size={14} className="opacity-60" />
                    </Button>
                    <PermissionGate module="CREDENTIALS" action="EDIT">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setEditId(slot.boundCredential!.id)}
                      >
                        Edit
                      </Button>
                    </PermissionGate>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground h-8 px-2"
                      title="Unlink slot"
                      onClick={() => void handleUnbind(slot.slotKey)}
                    >
                      <Unlink size={14} />
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    <PermissionGate module="CREDENTIALS" action="ADD">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => setCreateSlot(slot)}
                      >
                        <Plus size={14} />
                        New
                      </Button>
                    </PermissionGate>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setPickSlot(slot)}
                    >
                      Pick
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <CredentialDetailDialog
        credentialId={detailId}
        open={detailId !== null}
        onOpenChange={(o) => {
          if (!o) setDetailId(null);
        }}
      />

      <EditCredentialDialog
        credentialId={editId}
        open={editId !== null}
        onOpenChange={(o) => {
          if (!o) setEditId(null);
        }}
        onSaved={() => {
          setEditId(null);
          void load();
          onRefreshDetail();
        }}
      />

      {pickSlot ? (
        <PickAccessSlotCredentialDialog
          open
          onOpenChange={(o) => {
            if (!o) setPickSlot(null);
          }}
          projectId={projectId}
          productId={productId}
          slot={pickSlot}
          onBound={() => {
            setPickSlot(null);
            void load();
            onRefreshDetail();
          }}
        />
      ) : null}

      {createSlot ? (
        <CreateAccessSlotCredentialDialog
          open
          onOpenChange={(o) => {
            if (!o) setCreateSlot(null);
          }}
          projectId={projectId}
          productId={productId}
          slot={createSlot}
          onBound={() => {
            setCreateSlot(null);
            void load();
            onRefreshDetail();
          }}
        />
      ) : null}
    </section>
  );
}
