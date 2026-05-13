'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared';
import {
  PARTNER_AGREEMENT_STATUSES,
  getPartnerAgreementStatus,
} from '@/features/partners/constants/partners';
import { sliceIsoToDateInput } from '@/features/partners/utils/partner-detail-format';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { getApiErrorMessage } from '@/lib/api-errors';

interface PartnerAgreementsCardProps {
  partner: Partner;
  onSaved: (updated: Partner) => void;
}

export function PartnerAgreementsCard({ partner, onSaved }: PartnerAgreementsCardProps) {
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    agreementStatus: partner.agreementStatus,
    agreementStartDate: sliceIsoToDateInput(partner.agreementStartDate),
    agreementEndDate: sliceIsoToDateInput(partner.agreementEndDate),
    agreementSpecialTerms: partner.agreementSpecialTerms ?? '',
    agreementFileAssetId: partner.agreementFileAssetId ?? '',
    agreementOwnerId: partner.agreementOwnerId ?? '',
  });

  useEffect(() => {
    setForm({
      agreementStatus: partner.agreementStatus,
      agreementStartDate: sliceIsoToDateInput(partner.agreementStartDate),
      agreementEndDate: sliceIsoToDateInput(partner.agreementEndDate),
      agreementSpecialTerms: partner.agreementSpecialTerms ?? '',
      agreementFileAssetId: partner.agreementFileAssetId ?? '',
      agreementOwnerId: partner.agreementOwnerId ?? '',
    });
    setFormError(null);
  }, [partner]);

  const agreementBadge = getPartnerAgreementStatus(form.agreementStatus);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const updated = await partnersApi.update(partner.id, {
        agreementStatus: form.agreementStatus,
        agreementStartDate: form.agreementStartDate.trim() || null,
        agreementEndDate: form.agreementEndDate.trim() || null,
        agreementSpecialTerms: form.agreementSpecialTerms.trim() || null,
        agreementFileAssetId: form.agreementFileAssetId.trim() || null,
        agreementOwnerId: form.agreementOwnerId.trim() || null,
      });
      onSaved(updated);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Agreement could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <FileText size={16} className="text-muted-foreground" />
        <h2 className="text-foreground text-sm font-semibold">Agreement</h2>
        {agreementBadge ? (
          <StatusBadge label={agreementBadge.label} variant={agreementBadge.variant} />
        ) : null}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Contract metadata and Drive file reference. File and owner IDs must exist in the system.
      </p>

      {partner.agreementFileAsset ? (
        <p className="text-muted-foreground mt-3 text-xs">
          Linked file:{' '}
          <span className="text-foreground font-medium">
            {partner.agreementFileAsset.displayName}
          </span>{' '}
          <span className="font-mono">({partner.agreementFileAsset.id})</span>
        </p>
      ) : null}
      {partner.agreementOwner ? (
        <p className="text-muted-foreground mt-1 text-xs">
          Owner:{' '}
          <span className="text-foreground font-medium">
            {partner.agreementOwner.firstName} {partner.agreementOwner.lastName}
          </span>{' '}
          <span className="font-mono">({partner.agreementOwner.id})</span>
        </p>
      ) : null}

      <form className="mt-4 space-y-4" onSubmit={submit}>
        {formError ? (
          <p className="text-destructive text-sm" role="alert">
            {formError}
          </p>
        ) : null}

        <div>
          <Label>Agreement status</Label>
          <Select
            value={form.agreementStatus}
            onValueChange={(v) => {
              if (v) setForm((prev) => ({ ...prev, agreementStatus: v }));
            }}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARTNER_AGREEMENT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="agr-start">Start date</Label>
            <Input
              id="agr-start"
              type="date"
              className="mt-1.5"
              value={form.agreementStartDate}
              onChange={(e) => setForm((p) => ({ ...p, agreementStartDate: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="agr-end">End date</Label>
            <Input
              id="agr-end"
              type="date"
              className="mt-1.5"
              value={form.agreementEndDate}
              onChange={(e) => setForm((p) => ({ ...p, agreementEndDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="agr-terms">Special terms</Label>
          <Textarea
            id="agr-terms"
            className="mt-1.5"
            rows={3}
            value={form.agreementSpecialTerms}
            onChange={(e) => setForm((p) => ({ ...p, agreementSpecialTerms: e.target.value }))}
            placeholder="Optional"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="agr-file">Drive file asset ID</Label>
            <Input
              id="agr-file"
              className="mt-1.5 font-mono text-xs"
              value={form.agreementFileAssetId}
              onChange={(e) => setForm((p) => ({ ...p, agreementFileAssetId: e.target.value }))}
              placeholder="Optional UUID"
            />
          </div>
          <div>
            <Label htmlFor="agr-owner">Agreement owner (employee ID)</Label>
            <Input
              id="agr-owner"
              className="mt-1.5 font-mono text-xs"
              value={form.agreementOwnerId}
              onChange={(e) => setForm((p) => ({ ...p, agreementOwnerId: e.target.value }))}
              placeholder="Optional UUID"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save agreement'}
          </Button>
        </div>
      </form>
    </div>
  );
}
