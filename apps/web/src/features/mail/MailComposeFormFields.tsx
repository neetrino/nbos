'use client';

import type { ReactNode } from 'react';
import { InlineField } from '@/components/shared';
import {
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import { MAIL_FIELD_GRID_CLASS } from './mail-ui-classes';

export interface MailComposeFromOption {
  value: string;
  label: string;
}

export interface MailComposeIdentityFieldsProps {
  from?: {
    value: string;
    options: MailComposeFromOption[];
    onChange: (value: string) => void;
  };
  to: string;
  cc: string;
  subject: string;
  onToChange: (value: string) => void;
  onCcChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  disabled?: boolean;
}

export function MailComposeIdentityFields({
  from,
  to,
  cc,
  subject,
  onToChange,
  onCcChange,
  onSubjectChange,
  disabled = false,
}: MailComposeIdentityFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      {from ? (
        <InlineField
          variant="controlled"
          label="From"
          type="select"
          value={from.value}
          options={from.options}
          onValueChange={from.onChange}
          placeholder="Select a mailbox"
          disabled={disabled}
        />
      ) : null}
      <div className={MAIL_FIELD_GRID_CLASS}>
        <InlineField
          variant="controlled"
          label="To"
          type="text"
          value={to}
          onValueChange={onToChange}
          placeholder="recipient@example.com, second@example.com"
          disabled={disabled}
        />
        <InlineField
          variant="controlled"
          label="Cc"
          type="text"
          value={cc}
          onValueChange={onCcChange}
          placeholder="optional"
          disabled={disabled}
        />
      </div>
      <InlineField
        variant="controlled"
        label="Subject"
        type="text"
        value={subject}
        onValueChange={onSubjectChange}
        placeholder="Subject"
        disabled={disabled}
      />
    </div>
  );
}

export function MailOutlinedMessageField({
  label = 'Message',
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
        'flex min-h-0 flex-1 flex-col',
        className,
      )}
    >
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{label}</span>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
