'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/shared/MoneyInput';
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
import type { Project } from '@/lib/api/projects';

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
  projects: Project[];
  projectsLoading: boolean;
  canSubmit: boolean;
  saving: boolean;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const { form, onFormChange, projects, projectsLoading, canSubmit, saving, onSubmit } = props;

  return (
    <form className="border-border mt-4 grid gap-3 rounded-lg border p-3" onSubmit={onSubmit}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="pst-project-id">Project</Label>
          <Select
            value={form.projectId}
            disabled={projectsLoading}
            onValueChange={(value) =>
              onFormChange((prev) => ({ ...prev, projectId: value ?? 'none' }))
            }
          >
            <SelectTrigger id="pst-project-id" className="mt-1.5">
              <SelectValue placeholder={projectsLoading ? 'Loading projects…' : 'Optional'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground mt-1 text-xs">
            Required before creating Finance from a term.
          </p>
        </div>
        <div>
          <Label htmlFor="pst-amount">Amount *</Label>
          <MoneyInput
            id="pst-amount"
            value={form.amount}
            onChange={(amount) => onFormChange((prev) => ({ ...prev, amount }))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div>
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
        <div>
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
        <div>
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

      <div>
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
