'use client';

import { Textarea } from '@/components/ui/textarea';
import {
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

export interface CredentialFormCommentFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function CredentialFormCommentField({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
}: CredentialFormCommentFieldProps) {
  return (
    <section className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
      <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{label}</span>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          DETAIL_SHEET_OUTLINED_SHELL_BORDER_CLASS,
          'bg-card hover:bg-card focus-within:bg-card min-h-[88px] rounded-xl px-3 py-3 shadow-none',
          className,
        )}
      />
    </section>
  );
}
