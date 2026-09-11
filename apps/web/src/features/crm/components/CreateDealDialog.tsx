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
import { dealsApi, type Deal } from '@/lib/api/deals';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (deal: Deal, options?: { openFull?: boolean }) => Promise<void> | void;
  prefill?: {
    leadId?: string;
    contactId?: string;
    contactName?: string;
  };
  forceNestedBackdrop?: boolean;
}

export function CreateDealDialog({
  open,
  onOpenChange,
  onCreated,
  prefill,
  forceNestedBackdrop = false,
}: CreateDealDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const canSubmit = name.trim().length > 0;
  const title = prefill?.leadId ? 'Convert Lead to Deal' : 'New Deal';

  useEffect(() => {
    if (!open) return;
    setName('');
  }, [open, prefill?.contactId, prefill?.leadId]);

  const createDeal = async (openFull: boolean) => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const deal = await dealsApi.create({
        name: name.trim(),
        ...(prefill?.leadId ? { leadId: prefill.leadId } : {}),
        ...(prefill?.contactId ? { contactId: prefill.contactId } : {}),
      });
      await onCreated(deal, { openFull });
      onOpenChange(false);
      setName('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create deal. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {prefill?.contactName ? (
          <p className="text-muted-foreground text-sm">
            Lead: <span className="text-foreground font-medium">{prefill.contactName}</span>
          </p>
        ) : null}
        <DealCreateForm
          name={name}
          loading={loading}
          canSubmit={canSubmit}
          onNameChange={setName}
          onCancel={() => onOpenChange(false)}
          onCreate={createDeal}
        />
      </DialogContent>
    </Dialog>
  );
}

function DealCreateForm({
  name,
  loading,
  canSubmit,
  onNameChange,
  onCancel,
  onCreate,
}: {
  name: string;
  loading: boolean;
  canSubmit: boolean;
  onNameChange: (name: string) => void;
  onCancel: () => void;
  onCreate: (openFull: boolean) => Promise<void>;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onCreate(false);
      }}
      className="space-y-4"
    >
      <div className="space-y-2.5">
        <Label htmlFor="create-deal-title">Title *</Label>
        <Input
          id="create-deal-title"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !canSubmit}
          onClick={() => void onCreate(true)}
        >
          Full
        </Button>
        <Button type="submit" disabled={loading || !canSubmit}>
          {loading ? 'Creating…' : 'Create Deal'}
        </Button>
      </DialogFooter>
    </form>
  );
}
