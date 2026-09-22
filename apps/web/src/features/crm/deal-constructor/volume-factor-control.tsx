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

const VOLUME_SLIDER_CLASS = 'accent-primary h-1.5 w-full cursor-pointer';

export function VolumeFactorControl({
  factor,
  disabled,
  onCommit,
}: {
  factor: string;
  disabled?: boolean;
  onCommit: (factor: string, reason: string | null) => void;
}) {
  const t = useTranslations('crm.dealSheet.dealConstructor');
  const saved = tenthsFromFactor(factor);
  const [draft, setDraft] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const shown = draft ?? saved;
  const label = t('volumeFactorLabel', { factor: formatVolumeFactor(shown) });
  return (
    <div className="px-2 pt-1">
      <VolumeSlider
        shown={shown}
        disabled={disabled}
        label={label}
        standardLabel={shown === VOLUME_FACTOR_STANDARD_TENTHS ? t('volumeStandard') : null}
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

function VolumeSlider({
  shown,
  disabled,
  label,
  standardLabel,
  onDraft,
  onRelease,
}: {
  shown: number;
  disabled?: boolean;
  label: string;
  standardLabel: string | null;
  onDraft: (value: number) => void;
  onRelease: (value: number) => void;
}) {
  return (
    <>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{label}</span>
        <span>{standardLabel}</span>
      </div>
      <input
        type="range"
        min={VOLUME_FACTOR_MIN_TENTHS}
        max={VOLUME_FACTOR_MAX_TENTHS}
        step={1}
        value={shown}
        disabled={disabled}
        aria-label={label}
        className={VOLUME_SLIDER_CLASS}
        onChange={(event) => onDraft(Number(event.target.value))}
        onPointerUp={(event) => onRelease(Number(event.currentTarget.value))}
        onKeyUp={(event) => onRelease(Number(event.currentTarget.value))}
      />
    </>
  );
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
