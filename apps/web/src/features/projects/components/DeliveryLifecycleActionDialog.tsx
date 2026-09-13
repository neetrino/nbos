'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, PauseCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NbosDatePicker } from '@/components/shared/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { translateLifecycleActionDialogCopy } from './delivery-board/delivery-board-message-keys';

const TOMORROW_OFFSET_DAYS = 1;
const DATE_INPUT_LENGTH = 10;

export type DeliveryLifecycleAction = 'pause' | 'cancel';

export interface DeliveryLifecycleActionPayload {
  reason: string;
  onHoldUntil?: string;
}

interface DeliveryLifecycleActionDialogProps {
  action: DeliveryLifecycleAction | null;
  entityLabel: string;
  isSubmitting: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: DeliveryLifecycleActionPayload) => void | Promise<void>;
}

export function DeliveryLifecycleActionDialog({
  action,
  entityLabel,
  isSubmitting,
  error,
  onOpenChange,
  onConfirm,
}: DeliveryLifecycleActionDialogProps) {
  const t = useTranslations('deliveryBoard');
  const [reason, setReason] = useState('');
  const [onHoldUntil, setOnHoldUntil] = useState(getTomorrowDateInput());
  const isPause = action === 'pause';
  const canSubmit = reason.trim().length > 0 && (!isPause || onHoldUntil.length > 0);
  const copy = translateLifecycleActionDialogCopy(action ?? 'cancel', entityLabel, isSubmitting, t);

  return (
    <Dialog
      open={Boolean(action)}
      onOpenChange={(open) => {
        if (!open) resetForm(setReason, setOnHoldUntil);
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={false} forceNestedBackdrop>
        <LifecycleActionHeader
          isPause={isPause}
          title={copy.title}
          description={copy.description}
        />
        <LifecycleActionFields
          isPause={isPause}
          isSubmitting={isSubmitting}
          reason={reason}
          onHoldUntil={onHoldUntil}
          reasonPlaceholder={copy.reasonPlaceholder}
          resumeDateLabel={t('actions.resumeTargetDate')}
          reasonLabel={t('actions.reason')}
          error={error}
          onReasonChange={setReason}
          onHoldUntilChange={setOnHoldUntil}
        />
        <LifecycleActionFooter
          isPause={isPause}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
          keepActiveLabel={t('actions.keepActive')}
          submitLabel={copy.submitLabel}
          onDismiss={() => onOpenChange(false)}
          onSubmit={() => {
            void onConfirm({ reason: reason.trim(), onHoldUntil });
            resetForm(setReason, setOnHoldUntil);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function LifecycleActionHeader({
  isPause,
  title,
  description,
}: {
  isPause: boolean;
  title: string;
  description: string;
}) {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        {isPause ? (
          <PauseCircle size={18} className="text-muted-foreground" />
        ) : (
          <AlertTriangle size={18} className="text-amber-500" />
        )}
        {title}
      </DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  );
}

function LifecycleActionFooter({
  isPause,
  isSubmitting,
  canSubmit,
  keepActiveLabel,
  submitLabel,
  onDismiss,
  onSubmit,
}: {
  isPause: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  keepActiveLabel: string;
  submitLabel: string;
  onDismiss: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogFooter className="gap-2 sm:justify-end">
      <Button type="button" variant="outline" disabled={isSubmitting} onClick={onDismiss}>
        {keepActiveLabel}
      </Button>
      <Button
        type="button"
        variant={isPause ? 'secondary' : 'destructive'}
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </DialogFooter>
  );
}

function LifecycleActionFields({
  isPause,
  isSubmitting,
  reason,
  onHoldUntil,
  reasonPlaceholder,
  resumeDateLabel,
  reasonLabel,
  error,
  onReasonChange,
  onHoldUntilChange,
}: {
  isPause: boolean;
  isSubmitting: boolean;
  reason: string;
  onHoldUntil: string;
  reasonPlaceholder: string;
  resumeDateLabel: string;
  reasonLabel: string;
  error?: string | null;
  onReasonChange: (value: string) => void;
  onHoldUntilChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {isPause && (
        <label className="space-y-1.5 text-xs font-medium">
          {resumeDateLabel}
          <NbosDatePicker
            value={onHoldUntil}
            disabled={isSubmitting}
            onChange={onHoldUntilChange}
            variant="extended"
            aria-label={resumeDateLabel}
          />
        </label>
      )}
      <div className="mb-2 flex flex-col gap-3">
        <label htmlFor="delivery-lifecycle-reason" className="text-s font-medium">
          {reasonLabel}
        </label>
        <Textarea
          id="delivery-lifecycle-reason"
          value={reason}
          disabled={isSubmitting}
          rows={2}
          placeholder={reasonPlaceholder}
          className="min-h-16 rounded-lg px-2.5 py-2 text-sm"
          onChange={(event) => onReasonChange(event.target.value)}
        />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function resetForm(setReason: (value: string) => void, setOnHoldUntil: (value: string) => void) {
  setReason('');
  setOnHoldUntil(getTomorrowDateInput());
}

function getTomorrowDateInput() {
  const date = new Date();
  date.setDate(date.getDate() + TOMORROW_OFFSET_DAYS);
  return date.toISOString().slice(0, DATE_INPUT_LENGTH);
}
