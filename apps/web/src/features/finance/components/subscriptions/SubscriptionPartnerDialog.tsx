'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Subscription } from '@/lib/api/finance';
import { subscriptionsApi } from '@/lib/api/finance';
import { partnersApi, type Partner } from '@/lib/api/partners';

const PARTNER_LIST_PAGE_SIZE = 200;

interface SubscriptionPartnerDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Subscription) => void;
}

export function SubscriptionPartnerDialog({
  subscription,
  open,
  onOpenChange,
  onSaved,
}: SubscriptionPartnerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string>('none');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPartnersLoading(true);
    partnersApi
      .getAll({
        page: 1,
        pageSize: PARTNER_LIST_PAGE_SIZE,
        status: 'ACTIVE',
      })
      .then((res) => {
        if (!cancelled) setPartners(res.items);
      })
      .catch(() => {
        if (!cancelled) setPartners([]);
      })
      .finally(() => {
        if (!cancelled) setPartnersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !subscription) return;
    setPartnerId(subscription.partner?.id ?? 'none');
    setFormError(null);
  }, [open, subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;

    setLoading(true);
    setFormError(null);
    try {
      const updated = await subscriptionsApi.update(subscription.id, {
        partnerId: partnerId === 'none' ? null : partnerId,
      });
      onSaved(updated);
      onOpenChange(false);
    } catch {
      setFormError('Partner could not be updated. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Partner for {subscription.code}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}

          <div>
            <Label>Partner</Label>
            <Select
              value={partnerId}
              onValueChange={(v) => {
                if (v) setPartnerId(v);
              }}
              disabled={partnersLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={partnersLoading ? 'Loading partners…' : 'Select partner'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-2 text-xs">
              Only Active partners are listed. Clearing removes revenue-share linkage for billing
              workflows that depend on it.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || partnersLoading}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
