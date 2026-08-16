'use client';

import { FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { RelationPickerField } from '@/components/shared';
import {
  useProjectRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const SERVICE_TYPE_OPTIONS = ['SEO', 'SMM', 'ADS', 'OTHER'] as const;
const PAYMENT_MODEL_OPTIONS = ['ONE_TIME', 'MONTHLY', 'CUSTOM'] as const;

export type PartnerOutboundCreateFormState = {
  projectId: string;
  serviceType: string;
  paymentModel: string;
  amount: string;
  billingStartDate: string;
  notes: string;
};

export function PartnerOutboundServiceTermCreateForm(props: {
  form: PartnerOutboundCreateFormState;
  onFormChange: React.Dispatch<React.SetStateAction<PartnerOutboundCreateFormState>>;
  projectLabel: string | null;
  onProjectLabelChange: (label: string | null) => void;
  canSubmit: boolean;
  saving: boolean;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const { form, onFormChange, projectLabel, onProjectLabelChange, canSubmit, saving, onSubmit } =
    props;
  const searchProjects = useProjectRelationSearch();
  const projectPicker = useRelationPickerActions('project');
  const projectValue = form.projectId === 'none' ? null : form.projectId;

  return (
    <form className="border-border mt-4 grid gap-3 rounded-lg border p-3" onSubmit={onSubmit}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <RelationPickerField
            label="Project"
            entityKind="project"
            value={projectValue}
            selectionLabel={projectLabel}
            placeholder="Optional — search project…"
            icon={<FolderKanban size={12} />}
            onSearch={searchProjects}
            onSelect={(id, label) => {
              onFormChange((prev) => ({ ...prev, projectId: id }));
              onProjectLabelChange(label);
            }}
            onClear={() => {
              onFormChange((prev) => ({ ...prev, projectId: 'none' }));
              onProjectLabelChange(null);
            }}
            {...projectPicker}
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Required before creating Finance from a term.
          </p>
        </div>
        <div>
          <NbosMoneyInput
            id="pst-amount"
            label="Amount *"
            value={form.amount}
            onChange={(amount) => onFormChange((prev) => ({ ...prev, amount }))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Service type</Label>
          <Select
            value={form.serviceType}
            onValueChange={(value) =>
              onFormChange((prev) => ({ ...prev, serviceType: value ?? prev.serviceType }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPE_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Payment model</Label>
          <Select
            value={form.paymentModel}
            onValueChange={(value) =>
              onFormChange((prev) => ({ ...prev, paymentModel: value ?? prev.paymentModel }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODEL_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pst-billing-start">Billing start date</Label>
          <NbosDatePicker
            id="pst-billing-start"
            mode="datetime"
            value={form.billingStartDate}
            onChange={(billingStartDate) => onFormChange((prev) => ({ ...prev, billingStartDate }))}
            aria-label="Billing start date"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pst-notes">Notes</Label>
        <Textarea
          id="pst-notes"
          value={form.notes}
          onChange={(e) => onFormChange((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Optional terms and agreement notes"
          rows={2}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!canSubmit || saving}>
          {saving ? 'Creating…' : 'Create service term'}
        </Button>
      </div>
    </form>
  );
}

export { SERVICE_TYPE_OPTIONS, PAYMENT_MODEL_OPTIONS };
