'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  formatVolumeFactor,
  VOLUME_FACTOR_MAX_TENTHS,
  VOLUME_FACTOR_MIN_TENTHS,
  VOLUME_FACTOR_STANDARD,
  VOLUME_FACTOR_STANDARD_TENTHS,
  VOLUME_REASON_MIN_LENGTH,
} from '@nbos/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Drawn scale is 0…2 so ×1.0 sits in the center. The stored value uses the same bounds. */
const VOLUME_TRACK_ORIGIN_TENTHS = 0;
const VOLUME_TICKS = [0, 5, 10, 15, 20] as const;

/** Width and thumb position for each tenth from ×0.0 to ×2.0. Classes stay literal for Tailwind. */
const VOLUME_STOP_CLASS = [
  { fill: 'w-0', place: 'left-0' },
  { fill: 'w-[5%]', place: 'left-[5%]' },
  { fill: 'w-[10%]', place: 'left-[10%]' },
  { fill: 'w-[15%]', place: 'left-[15%]' },
  { fill: 'w-[20%]', place: 'left-[20%]' },
  { fill: 'w-1/4', place: 'left-1/4' },
  { fill: 'w-[30%]', place: 'left-[30%]' },
  { fill: 'w-[35%]', place: 'left-[35%]' },
  { fill: 'w-[40%]', place: 'left-[40%]' },
  { fill: 'w-[45%]', place: 'left-[45%]' },
  { fill: 'w-1/2', place: 'left-1/2' },
  { fill: 'w-[55%]', place: 'left-[55%]' },
  { fill: 'w-[60%]', place: 'left-[60%]' },
  { fill: 'w-[65%]', place: 'left-[65%]' },
  { fill: 'w-[70%]', place: 'left-[70%]' },
  { fill: 'w-3/4', place: 'left-3/4' },
  { fill: 'w-[80%]', place: 'left-[80%]' },
  { fill: 'w-[85%]', place: 'left-[85%]' },
  { fill: 'w-[90%]', place: 'left-[90%]' },
  { fill: 'w-[95%]', place: 'left-[95%]' },
  { fill: 'w-full', place: 'left-full' },
] as const;

type VolumeDensity = 'default' | 'compact';

const VOLUME_DENSITY_CLASS = {
  default: {
    frame: 'px-1 py-1',
    pad: 'px-7',
    row: 'h-8',
    bar: 'h-6',
    thumb: 'h-7 w-12 text-xs',
    tick: 'size-1.5',
  },
  compact: {
    frame:
      'w-36 max-w-full origin-left scale-95 opacity-30 transition duration-150 ease-out group-hover/volume:scale-100 group-hover/volume:opacity-100 focus-within:scale-100 focus-within:opacity-100',
    pad: 'px-5',
    row: 'h-5',
    bar: 'h-3.5',
    thumb: 'h-4 w-10 text-[10px] leading-none',
    tick: 'size-1',
  },
} as const;

export function VolumeFactorControl({
  factor,
  disabled,
  density = 'default',
  onCommit,
}: {
  factor: string;
  disabled?: boolean;
  density?: VolumeDensity;
  onCommit: (factor: string, reason: string | null) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const saved = tenthsFromFactor(factor);
  const [draft, setDraft] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const shown = draft ?? saved;
  const label = t('volumeFactorLabel', { factor: formatVolumeFactor(shown) });
  const metrics = VOLUME_DENSITY_CLASS[density];
  return (
    <div className={metrics.frame}>
      <VolumeTrack
        shown={shown}
        disabled={disabled}
        label={label}
        metrics={metrics}
        onDraft={setDraft}
        onRelease={(value) => finishDraft(value, saved, setDraft, setPending, onCommit)}
      />
      <VolumeReasonDialog
        open={pending !== null}
        factor={pending === null ? VOLUME_FACTOR_STANDARD : formatVolumeFactor(pending)}
        onCancel={() => {
          setPending(null);
          setDraft(null);
        }}
        onSave={(reason) => {
          if (pending === null) return;
          onCommit(formatVolumeFactor(pending), reason);
          setPending(null);
          setDraft(null);
        }}
      />
    </div>
  );
}

type VolumeTrackProps = {
  shown: number;
  disabled?: boolean;
  label: string;
  metrics: (typeof VOLUME_DENSITY_CLASS)[VolumeDensity];
  onDraft: (value: number) => void;
  onRelease: (value: number) => void;
};

function VolumeTrack({ shown, disabled, label, metrics, onDraft, onRelease }: VolumeTrackProps) {
  const stop = volumeStopClass(shown);
  return (
    <div className={cn(metrics.pad, disabled && 'opacity-50')}>
      <div className={cn('relative', metrics.row)}>
        <div
          className={cn(
            'bg-foreground/10 absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full',
            metrics.bar,
          )}
        >
          <div className={cn('bg-primary absolute inset-y-0 left-0 rounded-full', stop.fill)} />
          <VolumeTicks shown={shown} tickClass={metrics.tick} />
          <VolumeThumb
            label={label}
            place={stop.place}
            thumbClass={metrics.thumb}
            adjusted={shown !== VOLUME_FACTOR_STANDARD_TENTHS}
          />
        </div>
        <input
          type="range"
          min={VOLUME_TRACK_ORIGIN_TENTHS}
          max={VOLUME_FACTOR_MAX_TENTHS}
          step={1}
          value={shown}
          disabled={disabled}
          aria-label={label}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
          onChange={(event) => onDraft(clampVolumeTenths(Number(event.target.value)))}
          onPointerUp={(event) => onRelease(clampVolumeTenths(Number(event.currentTarget.value)))}
          onKeyUp={(event) => onRelease(clampVolumeTenths(Number(event.currentTarget.value)))}
        />
      </div>
    </div>
  );
}

function VolumeThumb({
  label,
  place,
  thumbClass,
  adjusted,
}: {
  label: string;
  place: string;
  thumbClass: string;
  adjusted: boolean;
}) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white font-semibold tabular-nums shadow-[0_2px_6px_rgb(0_0_0/0.28),0_0_0_1px_rgb(0_0_0/0.08)]',
        thumbClass,
        adjusted ? 'text-primary' : 'text-neutral-950',
        place,
      )}
    >
      {label}
    </span>
  );
}

function VolumeTicks({ shown, tickClass }: { shown: number; tickClass: string }) {
  return VOLUME_TICKS.map((tick) => (
    <span
      key={tick}
      className={cn(
        'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full',
        tickClass,
        tick <= shown ? 'bg-white/90' : 'bg-foreground/25',
        volumeStopClass(tick).place,
      )}
    />
  ));
}

function volumeStopClass(tenths: number): { fill: string; place: string } {
  return VOLUME_STOP_CLASS[tenths] ?? VOLUME_STOP_CLASS[VOLUME_FACTOR_STANDARD_TENTHS];
}

function clampVolumeTenths(value: number): number {
  if (value < VOLUME_FACTOR_MIN_TENTHS) return VOLUME_FACTOR_MIN_TENTHS;
  if (value > VOLUME_FACTOR_MAX_TENTHS) return VOLUME_FACTOR_MAX_TENTHS;
  return value;
}

function finishDraft(
  shown: number,
  saved: number,
  setDraft: (value: number | null) => void,
  setPending: (value: number | null) => void,
  onCommit: (factor: string, reason: string | null) => void,
): void {
  if (shown === saved) {
    setDraft(null);
    return;
  }
  if (shown === VOLUME_FACTOR_STANDARD_TENTHS) {
    onCommit(VOLUME_FACTOR_STANDARD, null);
    setDraft(null);
    return;
  }
  setPending(shown);
}

type VolumeReasonDialogProps = {
  open: boolean;
  factor: string;
  onCancel: () => void;
  onSave: (reason: string) => void;
};

function tenthsFromFactor(factor: string): number {
  const tenths = Math.round(Number(factor) * 10);
  if (tenths < VOLUME_FACTOR_MIN_TENTHS || tenths > VOLUME_FACTOR_MAX_TENTHS) {
    return VOLUME_FACTOR_STANDARD_TENTHS;
  }
  return tenths;
}

function VolumeReasonDialog({ open, factor, onCancel, onSave }: VolumeReasonDialogProps) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const [reason, setReason] = useState('');
  const close = () => {
    setReason('');
    onCancel();
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('volumeReasonTitle', { factor })}</DialogTitle>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t('volumeReasonPlaceholder')}
          className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            {t('volumeReasonCancel')}
          </Button>
          <Button
            type="button"
            disabled={reason.trim().length < VOLUME_REASON_MIN_LENGTH}
            onClick={() => {
              onSave(reason.trim());
              setReason('');
            }}
          >
            {t('volumeReasonSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
