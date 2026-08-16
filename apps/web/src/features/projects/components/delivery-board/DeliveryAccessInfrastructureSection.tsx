'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared/detail-sheet-classes';
import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { productsApi, type ProductAccessSlotRow } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CreateAccessSlotCredentialDialog } from './delivery-access-slot-dialogs';
import { DeliveryAccessSlotField } from './DeliveryAccessSlotField';

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
          <DeliveryAccessSlotField
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
