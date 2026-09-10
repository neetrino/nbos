'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileDockFormSheet } from '@/components/layout/MobileDockFormSheet';
import { CrmCreateFormActionBar } from '@/features/crm/components/crm-create-form-action-bar';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { leadsApi, type Lead } from '@/lib/api/leads';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (lead: Lead, options?: { openFull?: boolean }) => Promise<void> | void;
}

export function CreateLeadDialog({ open, onOpenChange, onCreated }: CreateLeadDialogProps) {
  const isMobileViewport = useIsMobileViewport();
  const form = (
    <LeadCreateForm isMobile={isMobileViewport} onOpenChange={onOpenChange} onCreated={onCreated} />
  );

  if (isMobileViewport) {
    return (
      <MobileDockFormSheet
        open={open}
        onOpenChange={onOpenChange}
        title="New Lead"
        description="Create a new lead."
      >
        {form}
      </MobileDockFormSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
}

function LeadCreateForm({
  isMobile,
  onOpenChange,
  onCreated,
}: {
  isMobile: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: CreateLeadDialogProps['onCreated'];
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const canSubmit = form.name.trim().length > 0;

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
      setForm({ name: '', phone: '', email: '' });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create lead. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void createLead(false);
      }}
      className="space-y-4"
    >
      <LeadCreateFields form={form} onChange={setForm} />
      <CrmCreateFormActionBar isMobile={isMobile}>
        <LeadCreateActions
          loading={loading}
          canSubmit={canSubmit}
          onCancel={() => onOpenChange(false)}
          onFull={() => void createLead(true)}
        />
      </CrmCreateFormActionBar>
    </form>
  );
}

function LeadCreateFields({
  form,
  onChange,
}: {
  form: { name: string; phone: string; email: string };
  onChange: (form: { name: string; phone: string; email: string }) => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="create-lead-title">Title *</Label>
        <Input
          id="create-lead-title"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          autoFocus
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="create-lead-phone">Phone</Label>
          <Input
            id="create-lead-phone"
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create-lead-email">Email</Label>
          <Input
            id="create-lead-email"
            type="email"
            value={form.email}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
          />
        </div>
      </div>
    </>
  );
}

function LeadCreateActions({
  loading,
  canSubmit,
  onCancel,
  onFull,
}: {
  loading: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onFull: () => void;
}) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" variant="secondary" disabled={loading || !canSubmit} onClick={onFull}>
        Full
      </Button>
      <Button type="submit" disabled={loading || !canSubmit}>
        {loading ? 'Creating...' : 'Create Lead'}
      </Button>
    </>
  );
}
