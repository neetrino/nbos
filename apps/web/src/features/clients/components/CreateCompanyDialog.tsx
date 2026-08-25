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
import { DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import { COMPANY_TYPES, TAX_STATUSES } from '../constants/clients';
import { companiesApi, type Company } from '@/lib/api/clients';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (company?: Company) => void;
  defaultName?: string;
  /** When opened above an entity sheet floating rail. */
  forceNestedBackdrop?: boolean;
}

const EMPTY_FORM = {
  name: '',
  type: 'LEGAL',
  taxStatus: 'TAX',
};

const COMPANY_TYPE_OPTIONS = COMPANY_TYPES.map((t) => ({ value: t.value, label: t.label }));
const TAX_STATUS_OPTIONS = TAX_STATUSES.map((s) => ({ value: s.value, label: s.label }));

export function CreateCompanyDialog({
  open,
  onOpenChange,
  onCreated,
  defaultName = '',
  forceNestedBackdrop = false,
}: CreateCompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open || !defaultName.trim()) return;
    setForm((prev) => ({ ...prev, name: defaultName.trim() }));
  }, [open, defaultName]);

  const canSubmit = Boolean(form.name) && Boolean(form.type) && Boolean(form.taxStatus);

  const reset = () => {
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const created = await companiesApi.create({
        name: form.name,
        type: form.type,
        taxStatus: form.taxStatus,
      });
      onCreated?.(created);
      onOpenChange(false);
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-[540px]" forceNestedBackdrop={forceNestedBackdrop}>
        <DialogHeader>
          <DialogTitle>New Company</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InlineField
            variant="controlled"
            label="Name"
            type="text"
            value={form.name}
            placeholder="Short name for lists and search"
            disabled={loading}
            onValueChange={(name) => setForm((prev) => ({ ...prev, name }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <InlineField
              variant="controlled"
              label="Type"
              type="select"
              value={form.type}
              options={COMPANY_TYPE_OPTIONS}
              disabled={loading}
              onValueChange={(type) => {
                if (type) setForm((prev) => ({ ...prev, type }));
              }}
            />
            <DetailSheetFieldSegmented
              label="Tax status"
              value={form.taxStatus}
              options={TAX_STATUS_OPTIONS}
              onValueChange={(taxStatus) => setForm((prev) => ({ ...prev, taxStatus }))}
              disabled={loading}
              ariaLabel="Tax status"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
