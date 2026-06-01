'use client';

import { Button } from '@/components/ui/button';
import { NbosMoneyInput } from '@/components/shared/NbosMoneyInput';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ClientServiceSelectField(props: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ClientServiceMoneyInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return <NbosMoneyInput label={props.label} value={props.value} onChange={props.onChange} />;
}

export function ClientServiceDateInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{props.label}</Label>
      <NbosDatePicker value={props.value} onChange={props.onChange} aria-label={props.label} />
    </div>
  );
}

export function ClientServiceFormFooter(props: {
  onCancel: () => void;
  submitting: boolean;
  canSubmit: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-4 pt-2">
      <Button type="button" variant="outline" size="form" onClick={props.onCancel}>
        Cancel
      </Button>
      <Button type="submit" size="form" disabled={!props.canSubmit || props.submitting}>
        {props.submitting ? 'Saving…' : props.submitLabel}
      </Button>
    </div>
  );
}
