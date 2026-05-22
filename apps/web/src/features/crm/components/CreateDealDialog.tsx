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
}

export function CreateDealDialog({
  open,
  onOpenChange,
  onCreated,
  prefill,
}: CreateDealDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const canSubmit = name.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    setName('');
  }, [open, prefill?.contactId, prefill?.leadId]);

  const reset = () => setName('');

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
      reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create deal. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDeal(false);
  };

  const title = prefill?.leadId ? 'Convert Lead to Deal' : 'New Deal';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {prefill?.contactName ? (
          <p className="text-muted-foreground text-sm">
            Lead: <span className="text-foreground font-medium">{prefill.contactName}</span>
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || !canSubmit}
              onClick={() => void createDeal(true)}
            >
              Full
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating…' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
