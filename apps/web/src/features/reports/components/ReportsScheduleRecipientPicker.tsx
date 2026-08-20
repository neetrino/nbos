'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ReportScheduleRecipientRole } from '@/lib/api/reports';

const RECIPIENT_OPTIONS: Array<{ role: ReportScheduleRecipientRole; label: string; hint: string }> =
  [
    { role: 'OWNER', label: 'Owner', hint: 'Company Owner role' },
    { role: 'CEO', label: 'CEO', hint: 'Company CEO role' },
    { role: 'SCHEDULE_OWNER', label: 'Me', hint: 'Your work email' },
  ];

interface ReportsScheduleRecipientPickerProps {
  value: ReportScheduleRecipientRole[];
  onChange: (roles: ReportScheduleRecipientRole[]) => void;
}

export function ReportsScheduleRecipientPicker({
  value,
  onChange,
}: ReportsScheduleRecipientPickerProps) {
  function toggle(role: ReportScheduleRecipientRole, checked: boolean) {
    if (checked) {
      onChange(value.includes(role) ? value : [...value, role]);
      return;
    }
    onChange(value.filter((item) => item !== role));
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Email the file to</p>
      <div className="flex flex-wrap gap-3">
        {RECIPIENT_OPTIONS.map((option) => {
          const checkboxId = `report-recipient-${option.role.toLowerCase()}`;
          return (
            <label
              key={option.role}
              htmlFor={checkboxId}
              className="border-border bg-background flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2"
            >
              <Checkbox
                id={checkboxId}
                checked={value.includes(option.role)}
                onCheckedChange={(next) => toggle(option.role, next === true)}
              />
              <span>
                <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-medium">
                  {option.label}
                </Label>
                <span className="text-muted-foreground block text-xs">{option.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
