'use client';

import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CREATE_FORM_BODY_CLASS,
  CREATE_FORM_DIALOG_CONTENT_CLASS,
  CREATE_FORM_TITLE_ROW_CLASS,
} from './create-form-layout';

export interface CreateFormDialogSecondaryAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface CreateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  error?: string | null;
  submitting?: boolean;
  canSubmit: boolean;
  submitLabel: string;
  submittingLabel: string;
  cancelLabel: string;
  secondaryAction?: CreateFormDialogSecondaryAction;
  forceNestedBackdrop?: boolean;
  titleAccessory?: ReactNode;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
}

export function CreateFormDialog({
  open,
  onOpenChange,
  title,
  description,
  error = null,
  submitting = false,
  canSubmit,
  submitLabel,
  submittingLabel,
  cancelLabel,
  secondaryAction,
  forceNestedBackdrop = false,
  titleAccessory,
  onSubmit,
  children,
}: CreateFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={CREATE_FORM_DIALOG_CONTENT_CLASS}
        forceNestedBackdrop={forceNestedBackdrop}
      >
        <DialogHeader>
          {titleAccessory ? (
            <div className={CREATE_FORM_TITLE_ROW_CLASS}>
              <DialogTitle>{title}</DialogTitle>
              {titleAccessory}
            </div>
          ) : (
            <DialogTitle>{title}</DialogTitle>
          )}
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={onSubmit} className={CREATE_FORM_BODY_CLASS}>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {children}
          <CreateFormDialogFooter
            submitting={submitting}
            canSubmit={canSubmit}
            submitLabel={submitLabel}
            submittingLabel={submittingLabel}
            cancelLabel={cancelLabel}
            secondaryAction={secondaryAction}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateFormDialogFooter({
  submitting,
  canSubmit,
  submitLabel,
  submittingLabel,
  cancelLabel,
  secondaryAction,
  onCancel,
}: {
  submitting: boolean;
  canSubmit: boolean;
  submitLabel: string;
  submittingLabel: string;
  cancelLabel: string;
  secondaryAction?: CreateFormDialogSecondaryAction;
  onCancel: () => void;
}) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      {secondaryAction ? (
        <Button
          type="button"
          variant="secondary"
          disabled={submitting || secondaryAction.disabled}
          onClick={secondaryAction.onClick}
        >
          {secondaryAction.label}
        </Button>
      ) : null}
      <Button type="submit" disabled={submitting || !canSubmit}>
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </DialogFooter>
  );
}
