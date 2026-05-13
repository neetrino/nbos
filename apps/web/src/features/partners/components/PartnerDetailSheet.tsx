'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Handshake, Pencil } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu } from '@/components/shared';
import { EntitySheetFloatingRail } from '@/components/shared/entity-sheet-floating-rail';
import { EditPartnerDialog } from '@/features/partners/components/EditPartnerDialog';
import { PartnerDetailTabs } from '@/features/partners/components/PartnerDetailTabs';
import { PartnerLifecycleStages } from '@/features/partners/components/PartnerLifecycleStages';
import { getPartnerLevel } from '@/features/partners/constants/partners';
import { formatPartnerDateTime } from '@/features/partners/utils/partner-detail-format';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PARTNER_OPEN_QUERY } from '@/features/partners/constants/partner-open-query';

interface PartnerDetailSheetProps {
  partnerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerUpdated?: (partner: Partner) => void;
}

export function PartnerDetailSheet({
  partnerId,
  open,
  onOpenChange,
  onPartnerUpdated,
}: PartnerDetailSheetProps) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [accrualsReloadKey, setAccrualsReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const data = await partnersApi.getById(partnerId);
      setPartner(data);
      setAccrualsReloadKey((k) => k + 1);
    } catch (caught) {
      setPartner(null);
      toast.error(getApiErrorMessage(caught, 'Partner could not be opened.'));
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [partnerId, onOpenChange]);

  useEffect(() => {
    if (!open || !partnerId) {
      setPartner(null);
      return;
    }
    void load();
  }, [open, partnerId, load]);

  const patchPartner = useCallback(
    (next: Partner) => {
      setPartner(next);
      onPartnerUpdated?.(next);
    },
    [onPartnerUpdated],
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
    [partner, patchPartner, statusBusy],
  );

  const tier = partner ? getPartnerLevel(partner.level) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          floatingClose
          floatingRailVisible={open}
          floatingRailAnchorClassName="sm:right-[75vw]"
          floatingRail={
            partner ? (
              <EntitySheetFloatingRail
                sourcePageHref={`/partners?${PARTNER_OPEN_QUERY}=${encodeURIComponent(partner.id)}`}
              />
            ) : null
          }
          className="flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:data-[side=right]:w-[75vw]"
        >
          {!partnerId ? null : (
            <>
              <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mt-1 inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                      <Handshake className="text-primary size-5 shrink-0" aria-hidden />
                      <h2 className="text-foreground max-w-[28rem] truncate text-xl font-bold tracking-tight">
                        {loading ? '…' : (partner?.name ?? 'Partner')}
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
                      <DropdownMenuItem
                        onClick={() => setEditOpen(true)}
                        disabled={!partner || loading}
                      >
                        <Pencil />
                        Edit partner
                      </DropdownMenuItem>
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
                    disabled={loading || statusBusy}
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
                  {loading || !partner ? (
                    <div className="space-y-4">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <PartnerDetailTabs
                      key={partner.id}
                      partner={partner}
                      onPartnerUpdated={patchPartner}
                      accrualsReloadKey={accrualsReloadKey}
                    />
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {partner ? (
        <EditPartnerDialog
          partner={partner}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={(updated) => {
            patchPartner(updated);
            setEditOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
