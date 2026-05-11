'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Asterisk, ChevronRight, KeyRound, Loader2, Plus, Unlink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CredentialDetailDialog } from '@/features/credentials/components/CredentialDetailDialog';
import { EditCredentialDialog } from '@/features/credentials/components/EditCredentialDialog';
import { PermissionGate } from '@/lib/permissions';
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

function linkedCredentialIdsFromSlots(slots: ProductAccessSlotRow[]): string[] {
  const ids: string[] = [];
  for (const s of slots) {
    for (const b of s.bindings) {
      if (b.boundCredential?.id) ids.push(b.boundCredential.id);
    }
  }
  return ids;
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

  const excludedCredentialIds = useMemo(() => linkedCredentialIdsFromSlots(slots), [slots]);

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

  async function handleUnbind(bindingId: string) {
    if (!window.confirm('Remove this link? The credential stays in the vault.')) {
      return;
    }
    try {
      await productsApi.unbindAccessSlotBinding(productId, bindingId);
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
          {slots.map((slot) => {
            const filledCount = slot.bindings.filter((b) => b.boundCredential !== null).length;
            const requiredMissing = slot.required && filledCount === 0;
            return (
              <li
                key={slot.slotKey}
                className="border-border bg-background/60 rounded-lg border px-3 py-2.5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    {slot.required ? (
                      <span
                        title="At least one credential required for this slot"
                        className="shrink-0 text-amber-600"
                      >
                        <Asterisk size={14} strokeWidth={2.5} aria-hidden />
                      </span>
                    ) : (
                      <span className="w-3.5 shrink-0" aria-hidden />
                    )}
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{slot.label}</span>
                      {requiredMissing ? (
                        <p className="text-muted-foreground text-xs">
                          Add at least one credential.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:items-end">
                    {slot.bindings.length > 0 ? (
                      <ul className="flex w-full max-w-full flex-col gap-1.5 sm:max-w-md sm:items-end">
                        {slot.bindings.map((b) => (
                          <li
                            key={b.bindingId}
                            className="border-border/80 bg-background/40 flex w-full flex-wrap items-center justify-end gap-1 rounded-md border border-dashed px-2 py-1.5"
                          >
                            {b.boundCredential ? (
                              <>
                                <Badge variant="outline" className="shrink-0 font-normal">
                                  {b.boundCredential.category}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 max-w-[12rem] min-w-0 flex-1 gap-1 px-2 sm:max-w-[14rem] sm:flex-initial"
                                  onClick={() => setDetailId(b.boundCredential!.id)}
                                >
                                  <span className="truncate text-sm font-medium">
                                    {b.boundCredential.name}
                                  </span>
                                  <ChevronRight size={14} className="shrink-0 opacity-60" />
                                </Button>
                                <PermissionGate module="CREDENTIALS" action="EDIT">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setEditId(b.boundCredential!.id)}
                                  >
                                    Edit
                                  </Button>
                                </PermissionGate>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                Archived credential — remove link to replace.
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground h-8 px-2"
                              title="Unlink"
                              onClick={() => void handleUnbind(b.bindingId)}
                            >
                              <Unlink size={14} />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="flex flex-wrap justify-end gap-1">
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
                  </div>
                </div>
              </li>
            );
          })}
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
          excludedCredentialIds={excludedCredentialIds}
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
