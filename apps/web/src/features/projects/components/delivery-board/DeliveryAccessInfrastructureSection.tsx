'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { KeyRound, Loader2 } from 'lucide-react';
import { DetailSheetCollapsibleSection } from '@/components/shared';
import { CredentialFormSheet } from '@/features/credentials/components/credential-form-sheet';
import { PRODUCT_DONE_REQUIRED_ACCESS_SLOT_KEYS, UNIVERSAL_ACCESS_SLOT_KEY } from '@nbos/shared';
import { productsApi, type ProductAccessSlotRow } from '@/lib/api/products';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CreateAccessSlotCredentialDialog } from './delivery-access-slot-dialogs';
import { DeliveryAccessSlotField } from './DeliveryAccessSlotField';
import { deliveryStageGateSectionClass } from './delivery-stage-gate-highlight';

interface DeliveryAccessInfrastructureSectionProps {
  projectId: string;
  productId: string;
  productName: string;
  onRefreshDetail: () => void;
  gateRequiredFields?: ReadonlySet<string>;
  /** Optional right column (languages, payment summary, etc.) inside the same card. */
  setupPanel?: ReactNode;
}

export function DeliveryAccessInfrastructureSection({
  projectId,
  productId,
  productName,
  onRefreshDetail,
  gateRequiredFields = new Set(),
  setupPanel,
}: DeliveryAccessInfrastructureSectionProps) {
  const t = useTranslations('deliveryBoard');
  const [sectionOpen, setSectionOpen] = useState(true);
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
      toast.error(t('access.loadFailed'));
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUnbind(bindingId: string) {
    if (!window.confirm(t('access.unlinkConfirm'))) {
      return;
    }
    try {
      await productsApi.unbindAccessSlotBinding(productId, bindingId);
      toast.success(t('access.linkRemoved'));
      await load();
      onRefreshDetail();
    } catch {
      toast.error(t('access.unlinkFailed'));
    }
  }

  async function handleBind(slotKey: string, credentialId: string) {
    try {
      await productsApi.bindAccessSlot(productId, { slotKey, credentialId });
      toast.success(t('access.linkSaved'));
      await load();
      onRefreshDetail();
    } catch {
      toast.error(t('access.linkFailed'));
    }
  }

  function renderSlotBody() {
    if (loading) {
      return (
        <div className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t('access.loading')}
        </div>
      );
    }
    if (slots.length === 0) {
      return <p className="text-muted-foreground text-sm">{t('access.empty')}</p>;
    }
    return (
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
        {visibleDeliveryAccessSlots(slots).map((slot) => (
          <DeliveryAccessSlotField
            key={slot.slotKey}
            slot={slot}
            onOpenCredential={(id) => {
              setSheetCredentialId(id);
              setSheetOpen(true);
            }}
            productId={productId}
            onCreate={() => setCreateSlot(slot)}
            onBind={(credentialId) => void handleBind(slot.slotKey, credentialId)}
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
    <>
      <DetailSheetCollapsibleSection
        title={t('access.title')}
        icon={<KeyRound size={12} />}
        open={sectionOpen}
        onOpenChange={setSectionOpen}
        className={cn('shadow-sm', deliveryStageGateSectionClass(gateRequiredFields, 'access'))}
      >
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
      </DetailSheetCollapsibleSection>

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
          productName={productName}
          slot={createSlot}
          onBound={() => {
            setCreateSlot(null);
            void load();
            onRefreshDetail();
          }}
        />
      ) : null}
    </>
  );
}

const DELIVERY_ACCESS_SLOT_KEYS = [
  'DOMAIN',
  'ADMIN',
  'HOSTING',
  UNIVERSAL_ACCESS_SLOT_KEY,
] as const;
const DELIVERY_ACCESS_SLOT_KEY_SET = new Set<string>(DELIVERY_ACCESS_SLOT_KEYS);
const DELIVERY_REQUIRED_SLOT_KEYS = new Set<string>(PRODUCT_DONE_REQUIRED_ACCESS_SLOT_KEYS);

function visibleDeliveryAccessSlots(slots: ProductAccessSlotRow[]): ProductAccessSlotRow[] {
  const byKey = new Map(slots.map((slot) => [slot.slotKey, slot]));
  const visible: ProductAccessSlotRow[] = [];

  for (const key of DELIVERY_ACCESS_SLOT_KEYS) {
    const slot = byKey.get(key);
    if (slot) visible.push(withDeliveryAccessRequired(slot));
  }

  for (const slot of slots) {
    if (DELIVERY_ACCESS_SLOT_KEY_SET.has(slot.slotKey) || slot.bindings.length === 0) continue;
    visible.push(slot);
  }

  return visible;
}

function withDeliveryAccessRequired(slot: ProductAccessSlotRow): ProductAccessSlotRow {
  if (slot.slotKey === 'ADMIN') return { ...slot, required: false };
  if (DELIVERY_REQUIRED_SLOT_KEYS.has(slot.slotKey)) return { ...slot, required: true };
  return slot;
}
