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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { leadsApi, type Lead, type LeadDuplicateLookupResult } from '@/lib/api/leads';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { LeadDuplicateBanner, hasDuplicateHits } from './LeadDuplicateBanner';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';

const DUPLICATE_LOOKUP_DEBOUNCE_MS = 350;

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (lead: Lead, options?: { openFull?: boolean }) => Promise<void> | void;
  onOpenExisting?: (leadId: string) => void;
}

export function CreateLeadDialog({
  open,
  onOpenChange,
  onCreated,
  onOpenExisting,
}: CreateLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [duplicates, setDuplicates] = useState<LeadDuplicateLookupResult | null>(null);

  const canSubmit = form.name.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (!phone && !email) {
      setDuplicates(null);
      return;
    }
    const handle = window.setTimeout(() => {
      void leadsApi
        .findDuplicates({ phone: phone || undefined, email: email || undefined })
        .then(setDuplicates)
        .catch(() => setDuplicates(null));
    }, DUPLICATE_LOOKUP_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [open, form.phone, form.email]);

  const reset = () => {
    setForm({ name: '', phone: '', email: '' });
    setDuplicates(null);
  };

  const createLead = async (openFull: boolean) => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const lead = await leadsApi.create({
        name: form.name.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      });
      await onCreated(lead, { openFull });
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create lead. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const openExisting = (leadId: string) => {
    onOpenExisting?.(leadId);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createLead(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="create-lead-title">Title *</Label>
            <Input
              id="create-lead-title"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-lead-phone">Phone</Label>
              <Input
                id="create-lead-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-lead-email">Email</Label>
              <Input
                id="create-lead-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {duplicates ? (
            <LeadDuplicateBanner
              result={duplicates}
              mode="create"
              onOpen={openExisting}
              onOpenContact={(id) =>
                window.open(`/clients/contacts?openId=${id}`, '_blank', 'noopener,noreferrer')
              }
              onOpenDeal={(id) =>
                window.open(
                  `/crm/deals?${CRM_OPEN_DEAL_QUERY}=${id}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            />
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || !canSubmit}
              onClick={() => void createLead(true)}
            >
              Full
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading
                ? 'Creating...'
                : duplicates && hasDuplicateHits(duplicates)
                  ? 'Create anyway'
                  : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
