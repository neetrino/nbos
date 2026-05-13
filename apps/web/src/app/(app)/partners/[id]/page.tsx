'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/shared';
import { EditPartnerDialog } from '@/features/partners/components/EditPartnerDialog';
import { PartnerDetailTabs } from '@/features/partners/components/PartnerDetailTabs';
import { formatPartnerDateTime } from '@/features/partners/utils/partner-detail-format';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { getApiErrorMessage } from '@/lib/api-errors';

export default function PartnerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [accrualsReloadKey, setAccrualsReloadKey] = useState(0);

  const fetchPartner = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await partnersApi.getById(id);
      setPartner(data);
      setError(null);
      setAccrualsReloadKey((k) => k + 1);
    } catch (caught) {
      setPartner(null);
      setError(
        getApiErrorMessage(caught, 'Partner could not be loaded. It may have been removed.'),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPartner();
  }, [fetchPartner]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-5">
        <LoadingState count={4} />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link
            href="/partners"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            aria-label="Back to partners"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-foreground text-2xl font-semibold">Partner</h1>
        </div>
        <ErrorState description={error ?? 'Not found'} onRetry={fetchPartner} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/partners"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'mt-0.5 shrink-0')}
            aria-label="Back to partners"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-foreground text-2xl font-semibold">{partner.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Created {formatPartnerDateTime(partner.createdAt)}
              {' · '}
              Updated {formatPartnerDateTime(partner.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => setEditOpen(true)}>
            <Pencil size={16} />
            Edit
          </Button>
        </div>
      </div>

      <EditPartnerDialog
        partner={partner}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(updated) => setPartner(updated)}
      />

      <PartnerDetailTabs
        partner={partner}
        onPartnerUpdated={(updated) => setPartner(updated)}
        accrualsReloadKey={accrualsReloadKey}
      />
    </div>
  );
}
