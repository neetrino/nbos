'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileDockFormSheet } from '@/components/layout/MobileDockFormSheet';
import { CrmCreateFormActionBar } from '@/features/crm/components/crm-create-form-action-bar';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
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
  const isMobileViewport = useIsMobileViewport();
  const title = prefill?.leadId ? 'Convert Lead to Deal' : 'New Deal';
  const form = (
    <DealCreateForm
      isMobile={isMobileViewport}
      open={open}
      onOpenChange={onOpenChange}
      onCreated={onCreated}
      prefill={prefill}
    />
  );

  if (isMobileViewport) {
    return (
      <MobileDockFormSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description="Create a new deal."
        forceNestedBackdrop={forceNestedBackdrop}
      >
        {form}
      </MobileDockFormSheet>
    );
  }

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
        {form}
      </DialogContent>
    </Dialog>
  );
}

function DealCreateForm({
  isMobile,
  open,
  onOpenChange,
  onCreated,
  prefill,
}: {
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: CreateDealDialogProps['onCreated'];
  prefill: CreateDealDialogProps['prefill'];
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const canSubmit = name.trim().length > 0;

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
    <DealCreateFormView
      isMobile={isMobile}
      contactName={prefill?.contactName}
      name={name}
      loading={loading}
      canSubmit={canSubmit}
      onNameChange={setName}
      onCancel={() => onOpenChange(false)}
      onFull={() => void createDeal(true)}
      onSubmit={() => void createDeal(false)}
    />
  );
}

function DealCreateFormView({
  isMobile,
  contactName,
  name,
  loading,
  canSubmit,
  onNameChange,
  onCancel,
  onFull,
  onSubmit,
}: {
  isMobile: boolean;
  contactName?: string;
  name: string;
  loading: boolean;
  canSubmit: boolean;
  onNameChange: (name: string) => void;
  onCancel: () => void;
  onFull: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <DealCreateFields
        isMobile={isMobile}
        contactName={contactName}
        name={name}
        onNameChange={onNameChange}
      />
      <CrmCreateFormActionBar isMobile={isMobile}>
        <DealCreateActions
          loading={loading}
          canSubmit={canSubmit}
          onCancel={onCancel}
          onFull={onFull}
        />
      </CrmCreateFormActionBar>
    </form>
  );
}

function DealCreateFields({
  isMobile,
  contactName,
  name,
  onNameChange,
}: {
  isMobile: boolean;
  contactName?: string;
  name: string;
  onNameChange: (name: string) => void;
}) {
  return (
    <>
      {isMobile && contactName ? (
        <p className="text-muted-foreground text-sm">
          Lead: <span className="text-foreground font-medium">{contactName}</span>
        </p>
      ) : null}
      <div className="space-y-2.5">
        <Label htmlFor="create-deal-title">Title *</Label>
        <Input
          id="create-deal-title"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus
        />
      </div>
    </>
  );
}

function DealCreateActions({
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
        {loading ? 'Creating…' : 'Create Deal'}
      </Button>
    </>
  );
}
