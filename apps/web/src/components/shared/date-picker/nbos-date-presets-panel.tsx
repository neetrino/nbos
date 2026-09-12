'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { buildDatePickerPresets, type DatePickerPreset } from './date-picker-presets';
import { isSameDay } from './date-picker-grid';

export interface NbosDatePresetsPanelProps {
  anchorDate: Date;
  selectedDate?: Date;
  locale: string;
  onSelectPreset: (date: Date) => void;
  className?: string;
}

export function NbosDatePresetsPanel({
  anchorDate,
  selectedDate,
  locale,
  onSelectPreset,
  className,
}: NbosDatePresetsPanelProps) {
  const t = useTranslations('forms');
  const presets = buildDatePickerPresets(anchorDate, locale);

  return (
    <div
      className={cn(
        'border-border/50 flex min-w-[11.5rem] flex-col gap-2 border-l pl-4',
        className,
      )}
    >
      {presets.map((preset) => (
        <PresetButton
          key={preset.id}
          preset={preset}
          label={t(`datePicker.presets.${preset.id}`)}
          active={selectedDate ? isSameDay(preset.date, selectedDate) : false}
          onSelect={() => onSelectPreset(preset.date)}
        />
      ))}
    </div>
  );
}

function PresetButton({
  preset,
  label,
  active,
  onSelect,
}: {
  preset: DatePickerPreset;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'border-primary/15 hover:border-primary/30 hover:bg-primary/5 bg-card flex w-full flex-col rounded-xl border px-3 py-2.5 text-left transition-colors',
        active && 'border-primary/40 bg-primary/5 ring-primary/20 ring-1',
      )}
    >
      <span className="text-foreground text-sm leading-tight font-semibold">{label}</span>
      <span className="text-muted-foreground mt-0.5 text-xs leading-snug">{preset.subtitle}</span>
    </button>
  );
}
