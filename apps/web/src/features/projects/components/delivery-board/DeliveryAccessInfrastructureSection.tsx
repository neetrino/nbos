'use client';

import { useCallback, useEffect, useState, createElement, type ReactNode } from 'react';
import { Asterisk, ChevronRight, KeyRound, Loader2, Plus, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DETAIL_SHEET_SECTION_TITLE_CLASS,
  RELATION_PICKER_EMPTY_TRIGGER_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { PermissionGate } from '@/lib/permissions';
import { productsApi, type ProductAccessSlotRow } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CreateAccessSlotCredentialDialog } from './delivery-access-slot-dialogs';
import { getDeliveryAccessSlotIcon } from './delivery-access-slot-icon';
import { formatDeliveryAccessSlotLabel } from './delivery-access-slot-label';

interface DeliveryAccessInfrastructureSectionProps {
  projectId: string;
  productId: string;
  onRefreshDetail: () => void;
  /** Optional right column (languages, payment summary, etc.) inside the same card. */
  setupPanel?: ReactNode;
}

export function DeliveryAccessInfrastructureSection({
  projectId,
  productId,
  onRefreshDetail,
  setupPanel,
}: DeliveryAccessInfrastructureSectionProps) {
  const [slots, setSlots] = useState<ProductAccessSlotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetCredentialId, setSheetCredentialId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
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

  function renderSlotBody() {
    if (loading) {
      return (
        <div className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading…
        </div>
      );
    }
    if (slots.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          No access slots are configured for this product profile.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-2 items-start gap-3">
        {slots.map((slot) => (
          <AccessSlotField
            key={slot.slotKey}
            slot={slot}
            onOpenCredential={(id) => {
              setSheetCredentialId(id);
              setSheetOpen(true);
            }}
            onCreate={() => setCreateSlot(slot)}
            onUnbind={(bindingId) => void handleUnbind(bindingId)}
          />
        ))}
      </div>
    );
  }

  if (!productId.trim()) {
    return null;
  }

  return (
    <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <h3 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-3')}>
        <KeyRound size={13} aria-hidden />
        Access & infrastructure
      </h3>

      {setupPanel ? (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">{renderSlotBody()}</div>
          <div className="border-border flex min-w-0 flex-col gap-4 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
            {setupPanel}
          </div>
        </div>
      ) : (
        renderSlotBody()
      )}

      <CredentialFormSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setSheetCredentialId(null);
        }}
        forceNestedBackdrop
        credentialId={sheetCredentialId}
        vaultScope="project"
        projectId={projectId}
        productId={productId}
        onSaved={() => {
          void load();
          onRefreshDetail();
        }}
      />

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

function AccessSlotField({
  slot,
  onOpenCredential,
  onCreate,
  onUnbind,
}: {
  slot: ProductAccessSlotRow;
  onOpenCredential: (credentialId: string) => void;
  onCreate: () => void;
  onUnbind: (bindingId: string) => void;
}) {
  const label = formatDeliveryAccessSlotLabel(slot.label);

  return (
    <div className="relative w-full min-w-0">
      <div className="text-foreground/85 mb-1.5 flex h-5 items-center justify-between gap-2 text-sm font-medium">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-muted-foreground/70 shrink-0">
            {createElement(getDeliveryAccessSlotIcon(slot.slotKey), {
              size: 12,
              'aria-hidden': true,
            })}
          </span>
          <span className="truncate">{label}</span>
          {slot.required ? (
            <span
              title="At least one credential required for this slot"
              className="shrink-0 text-amber-600"
            >
              <Asterisk size={12} strokeWidth={2.5} aria-hidden />
            </span>
          ) : null}
        </div>
        <PermissionGate module="CREDENTIALS" action="ADD">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6 shrink-0"
            title="New credential"
            aria-label="New credential"
            onClick={onCreate}
          >
            <Plus size={12} />
          </Button>
        </PermissionGate>
      </div>

      {slot.bindings.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {slot.bindings.map((b) => (
            <li key={b.bindingId} className="flex min-w-0 items-center gap-1">
              {b.boundCredential ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 min-w-0 flex-1 justify-start gap-1.5 rounded-xl px-3"
                  onClick={() => onOpenCredential(b.boundCredential!.id)}
                >
                  <span className="truncate text-left text-sm font-medium">
                    {b.boundCredential.name}
                  </span>
                  <ChevronRight size={14} className="ml-auto shrink-0 opacity-60" />
                </Button>
              ) : (
                <div
                  className={cn(
                    RELATION_PICKER_EMPTY_TRIGGER_CLASS,
                    'pointer-events-none flex-1 border-dashed italic',
                  )}
                >
                  Archived credential
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground size-8 shrink-0"
                title="Unlink"
                onClick={() => onUnbind(b.bindingId)}
              >
                <Unlink size={14} />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={cn(
            RELATION_PICKER_EMPTY_TRIGGER_CLASS,
            'pointer-events-none border-dashed italic',
          )}
        >
          Not linked
        </div>
      )}
    </div>
  );
}
