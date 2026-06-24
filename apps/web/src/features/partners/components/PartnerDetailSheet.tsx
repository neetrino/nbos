'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Handshake, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DeleteConfirmDialog,
  DetailSheetSettingsMenu,
  EntityDetailSheetContent,
  useDeleteConfirm,
} from '@/components/shared';
import { EditPartnerDialog } from '@/features/partners/components/EditPartnerDialog';
import { PartnerDetailTabs } from '@/features/partners/components/PartnerDetailTabs';
import { PartnerLifecycleStages } from '@/features/partners/components/PartnerLifecycleStages';
import { getPartnerLevel } from '@/features/partners/constants/partners';
import { formatPartnerDateTime } from '@/features/partners/utils/partner-detail-format';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PARTNER_OPEN_QUERY } from '@/features/partners/constants/partner-open-query';

interface PartnerDetailSheetProps {
  partnerId: string | null;
  initialPartner?: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerUpdated?: (partner: Partner) => void;
  isTrashView?: boolean;
  onMoveToTrash?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onPermanentDelete?: (id: string) => void;
  forceNestedBackdrop?: boolean;
}

export function PartnerDetailSheet({
  partnerId,
  initialPartner = null,
  open,
  onOpenChange,
  onPartnerUpdated,
  isTrashView = false,
  onMoveToTrash,
  onRestore,
  onPermanentDelete,
  forceNestedBackdrop = false,
}: PartnerDetailSheetProps) {
  const {
    entity: partner,
    setEntity: setPartner,
    loading,
  } = useEntityDetailHydration({
    entityId: partnerId ?? '',
    open: open && Boolean(partnerId),
    initialEntity: initialPartner,
    fetchById: partnersApi.getById,
    loadErrorMessage: 'Partner could not be opened.',
  });
  const [statusBusy, setStatusBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [accrualsReloadKey, setAccrualsReloadKey] = useState(0);
  const deleteConfirm = useDeleteConfirm();
  const inTrash = Boolean(partner?.trashedAt) || isTrashView;

  useEffect(() => {
    if (partner?.id) setAccrualsReloadKey((k) => k + 1);
  }, [partner?.id, partner?.updatedAt]);

  const patchPartner = useCallback(
    (next: Partner) => {
      setPartner(next);
      onPartnerUpdated?.(next);
    },
    [onPartnerUpdated, setPartner],
  );

  const handleStatusSelect = useCallback(
    async (status: 'ACTIVE' | 'PAUSED' | 'TERMINATED') => {
      if (!partner || partner.status === status || statusBusy) return;
      setStatusBusy(true);
      const prev = partner;
      patchPartner({ ...partner, status });
      try {
        const updated = await partnersApi.update(partner.id, { status });
        patchPartner(updated);
      } catch (caught) {
        setPartner(prev);
        toast.error(getApiErrorMessage(caught, 'Status could not be updated.'));
      } finally {
        setStatusBusy(false);
      }
    },
    [partner, patchPartner, setPartner, statusBusy],
  );

  const tier = partner ? getPartnerLevel(partner.level) : null;
  const showBodyLoading = loading && !partner;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          showRailActions={Boolean(partner)}
          forceNestedBackdrop={forceNestedBackdrop}
          sourcePageHref={
            partner ? `/partners?${PARTNER_OPEN_QUERY}=${encodeURIComponent(partner.id)}` : '#'
          }
        >
          {!partnerId ? null : (
            <>
              <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mt-1 inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                      <Handshake className="text-primary size-5 shrink-0" aria-hidden />
                      <h2 className="text-foreground max-w-[28rem] truncate text-xl font-bold tracking-tight">
                        {showBodyLoading ? '…' : (partner?.name ?? 'Partner')}
                      </h2>
                      {tier ? (
                        <span
                          className={cn(
                            'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                            'border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-300',
                          )}
                        >
                          {tier.label}
                        </span>
                      ) : null}
                    </div>
                    {partner ? (
                      <p className="text-muted-foreground mt-1 text-xs">
                        Updated {formatPartnerDateTime(partner.updatedAt)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                    <DetailSheetSettingsMenu>
                      {!inTrash ? (
                        <DropdownMenuItem
                          onClick={() => setEditOpen(true)}
                          disabled={!partner || loading}
                        >
                          <Pencil />
                          Edit partner
                        </DropdownMenuItem>
                      ) : null}
                      {inTrash && onRestore ? (
                        <DropdownMenuItem
                          disabled={!partner || loading}
                          onClick={() => partner && void onRestore(partner.id)}
                        >
                          <RotateCcw />
                          Restore
                        </DropdownMenuItem>
                      ) : null}
                      {inTrash && onPermanentDelete ? (
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={!partner || loading}
                          onClick={() => partner && onPermanentDelete(partner.id)}
                        >
                          <Trash2 />
                          Delete permanently
                        </DropdownMenuItem>
                      ) : null}
                      {!inTrash && onMoveToTrash ? (
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={!partner || loading}
                          onClick={() =>
                            partner && deleteConfirm.request({ id: partner.id, name: partner.name })
                          }
                        >
                          <Trash2 />
                          Move to Trash
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `${window.location.origin}/partners?${PARTNER_OPEN_QUERY}=${encodeURIComponent(partnerId)}`,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }
                        disabled={!partnerId}
                      >
                        <ExternalLink />
                        Open in new tab
                      </DropdownMenuItem>
                    </DetailSheetSettingsMenu>
                  </div>
                </div>
              </div>

              <div className="border-border shrink-0 border-b border-stone-100 dark:border-stone-800">
                {partner ? (
                  <PartnerLifecycleStages
                    currentStatus={partner.status}
                    disabled={loading || statusBusy || inTrash}
                    onStatusSelect={handleStatusSelect}
                  />
                ) : (
                  <div className="px-5 py-3">
                    <Skeleton className="h-9 w-full max-w-md" />
                  </div>
                )}
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="px-7 py-5">
                  {showBodyLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : partner ? (
                    <PartnerDetailTabs
                      key={partner.id}
                      partner={partner}
                      onPartnerUpdated={patchPartner}
                      accrualsReloadKey={accrualsReloadKey}
                    />
                  ) : null}
                </div>
              </ScrollArea>
            </>
          )}
        </EntityDetailSheetContent>
      </Sheet>

      {partner && !inTrash ? (
        <EditPartnerDialog
          partner={partner}
          open={editOpen}
          onOpenChange={setEditOpen}
          forceNestedBackdrop
          onSaved={(updated) => {
            patchPartner(updated);
            setEditOpen(false);
          }}
        />
      ) : null}

      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Move partner to Trash?"
        description="The partner will be removed from active lists. Linked orders and accruals stay intact; restore from Trash later."
        forceNestedBackdrop
        onConfirm={() => {
          const id = deleteConfirm.target?.id;
          deleteConfirm.clear();
          if (id && onMoveToTrash) void onMoveToTrash(id);
        }}
      />
    </>
  );
}
