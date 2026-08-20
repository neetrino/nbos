'use client';

import { useState } from 'react';
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
import { leadsApi, type Lead } from '@/lib/api/leads';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (lead: Lead, options?: { openFull?: boolean }) => Promise<void> | void;
}

export function CreateLeadDialog({ open, onOpenChange, onCreated }: CreateLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const canSubmit = form.name.trim().length > 0;

  const reset = () => {
    setForm({ name: '', phone: '', email: '' });
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
              {loading ? 'Creating...' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
