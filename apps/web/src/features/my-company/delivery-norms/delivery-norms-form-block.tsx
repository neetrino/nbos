import type { ReactNode } from 'react';
import { DETAIL_SHEET_SUBSECTION_LABEL_CLASS } from '@/components/shared/detail-sheet-classes';
import { CREATE_FORM_BODY_CLASS } from '@/components/shared/create-form';
import { FORM_BLOCK_CLASS } from './delivery-norms.constants';

export function DeliveryNormsFormBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={FORM_BLOCK_CLASS}>
      <h3 className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>{title}</h3>
      <div className={CREATE_FORM_BODY_CLASS}>{children}</div>
    </div>
  );
}
