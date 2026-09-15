import type { ReactNode } from 'react';
import { FORM_FIELD_ROW_2_CLASS } from './create-form-layout';

interface FormFieldRowProps {
  children: ReactNode;
}

export function FormFieldRow({ children }: FormFieldRowProps) {
  return <div className={FORM_FIELD_ROW_2_CLASS}>{children}</div>;
}
