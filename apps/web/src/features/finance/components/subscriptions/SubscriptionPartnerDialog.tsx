'use client';

import { useEffect, useState } from 'react';
import { Handshake } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RelationPickerField } from '@/components/shared';
import {
  usePartnerRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import { getApiErrorMessage } from '@/lib/api-errors';
import { getSubscriptionDisplayTitle } from '@/features/finance/utils/subscription-display';
import type { Subscription } from '@/lib/api/finance';
import { subscriptionsApi } from '@/lib/api/finance';

interface SubscriptionPartnerDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Subscription) => void;
  forceNestedBackdrop?: boolean;
}

export function SubscriptionPartnerDialog({
  subscription,
  open,
  onOpenChange,
  onSaved,
  forceNestedBackdrop = false,
}: SubscriptionPartnerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerLabel, setPartnerLabel] = useState<string | null>(null);
  const searchPartners = usePartnerRelationSearch();
  const partnerPicker = useRelationPickerActions('partner');

  useEffect(() => {
    if (!open || !subscription) return;
    setPartnerId(subscription.partner?.id ?? null);
    setPartnerLabel(subscription.partner?.name ?? null);
    setFormError(null);
  }, [open, subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;

    setLoading(true);
    setFormError(null);
    try {
      const updated = await subscriptionsApi.update(subscription.id, {
        partnerId,
      });
      onSaved(updated);
      onOpenChange(false);
    } catch (caught) {
      setFormError(
        getApiErrorMessage(
          caught,
          'Partner could not be updated. Check your connection and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>Partner for {getSubscriptionDisplayTitle(subscription)}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          <div>
            <RelationPickerField
              label="Partner"
              entityKind="partner"
              value={partnerId}
              selectionLabel={partnerLabel}
              placeholder="Search partners…"
              icon={<Handshake size={12} />}
              onSearch={searchPartners}
              onSelect={(id, label) => {
                setPartnerId(id);
                setPartnerLabel(label);
              }}
              onClear={() => {
                setPartnerId(null);
                setPartnerLabel(null);
              }}
              {...partnerPicker}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              Only Active partners are listed. Clearing removes revenue-share linkage for billing
              workflows that depend on it.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
