import type { ReactNode } from 'react';
import { FORM_FIELD_ROW_2_CLASS, FORM_FIELD_ROW_WIDE_START_CLASS } from './create-form-layout';

interface FormFieldRowProps {
  children: ReactNode;
  layout?: 'equal' | 'wideStart';
}

export function FormFieldRow({ children, layout = 'equal' }: FormFieldRowProps) {
  return (
    <div
      className={layout === 'wideStart' ? FORM_FIELD_ROW_WIDE_START_CLASS : FORM_FIELD_ROW_2_CLASS}
    >
      {children}
    </div>
  );
}
