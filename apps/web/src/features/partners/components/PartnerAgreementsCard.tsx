'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RelationPickerField, SearchField, StatusBadge } from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import {
  PARTNER_AGREEMENT_STATUSES,
  getPartnerAgreementStatus,
} from '@/features/partners/constants/partners';
import { useEmployeeSearchLoader } from '@/features/projects/components/delivery-board/delivery-item-detail-employee-search';
import { sliceIsoToDateInput } from '@/features/partners/utils/partner-detail-format';
import { partnersApi, type Partner } from '@/lib/api/partners';
import { driveApi } from '@/lib/api/drive';
import { getApiErrorMessage } from '@/lib/api-errors';

interface PartnerAgreementsCardProps {
  partner: Partner;
  onSaved: (updated: Partner) => void;
}

export function PartnerAgreementsCard({ partner, onSaved }: PartnerAgreementsCardProps) {
  const loadEmployees = useEmployeeSearchLoader();
  const employeePicker = useRelationPickerActions('employee');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fileDisplay, setFileDisplay] = useState('');
  const [ownerDisplay, setOwnerDisplay] = useState('');
  const [form, setForm] = useState({
    agreementStatus: partner.agreementStatus,
    agreementStartDate: sliceIsoToDateInput(partner.agreementStartDate),
    agreementEndDate: sliceIsoToDateInput(partner.agreementEndDate),
    agreementSpecialTerms: partner.agreementSpecialTerms ?? '',
    agreementFileAssetId: partner.agreementFileAssetId ?? '',
    agreementOwnerId: partner.agreementOwnerId ?? '',
  });

  const searchFiles = useCallback(async (query: string) => {
    const list = await driveApi.listFileAssets({
      status: 'ACTIVE',
      search: query || undefined,
    });
    return list.slice(0, 10).map((f) => ({
      value: f.id,
      label: f.displayName,
      subtitle: f.mimeType ?? f.fileType ?? undefined,
    }));
  }, []);

  useEffect(() => {
    setForm({
      agreementStatus: partner.agreementStatus,
      agreementStartDate: sliceIsoToDateInput(partner.agreementStartDate),
      agreementEndDate: sliceIsoToDateInput(partner.agreementEndDate),
      agreementSpecialTerms: partner.agreementSpecialTerms ?? '',
      agreementFileAssetId: partner.agreementFileAssetId ?? '',
      agreementOwnerId: partner.agreementOwnerId ?? '',
    });
    setFileDisplay(partner.agreementFileAsset?.displayName ?? '');
    setOwnerDisplay(
      partner.agreementOwner
        ? `${partner.agreementOwner.firstName} ${partner.agreementOwner.lastName}`
        : '',
    );
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
        Link a Drive file asset and an internal owner. Search picks existing records only.
      </p>

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
            <NbosDatePicker
              id="agr-start"
              className="mt-1.5"
              value={form.agreementStartDate}
              onChange={(agreementStartDate) => setForm((p) => ({ ...p, agreementStartDate }))}
              aria-label="Agreement start"
            />
          </div>
          <div>
            <Label htmlFor="agr-end">End date</Label>
            <NbosDatePicker
              id="agr-end"
              className="mt-1.5"
              value={form.agreementEndDate}
              onChange={(agreementEndDate) => setForm((p) => ({ ...p, agreementEndDate }))}
              clearable
              aria-label="Agreement end"
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

        <SearchField
          selectionMode="stage"
          label="Agreement document (Drive)"
          value={form.agreementFileAssetId || undefined}
          displayValue={
            fileDisplay ? <span className="text-foreground">{fileDisplay}</span> : undefined
          }
          placeholder="Search file assets…"
          onSearch={searchFiles}
          onStageSelect={(id, label) => {
            setForm((p) => ({ ...p, agreementFileAssetId: id }));
            setFileDisplay(label);
          }}
          onClear={() => {
            setForm((p) => ({ ...p, agreementFileAssetId: '' }));
            setFileDisplay('');
          }}
        />

        <RelationPickerField
          label="Agreement owner"
          entityKind="employee"
          value={form.agreementOwnerId || null}
          selectionLabel={ownerDisplay || null}
          placeholder="Search employees…"
          onSearch={loadEmployees}
          onSelect={(id, label) => {
            setForm((p) => ({ ...p, agreementOwnerId: id }));
            setOwnerDisplay(label);
          }}
          onClear={() => {
            setForm((p) => ({ ...p, agreementOwnerId: '' }));
            setOwnerDisplay('');
          }}
          {...employeePicker}
        />

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save agreement'}
          </Button>
        </div>
      </form>
    </div>
  );
}
