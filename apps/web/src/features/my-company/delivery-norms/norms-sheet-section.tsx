import type { ReactNode } from 'react';
import { DetailSheetSection } from '@/components/shared';
import { DETAIL_SHEET_SECTION_BODY_CLASS } from '@/components/shared/detail-sheet-classes';

export function NormsSheetSection({
  title,
  titleTrailing,
  children,
}: {
  title: string;
  titleTrailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DetailSheetSection title={title} titleTrailing={titleTrailing}>
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>{children}</div>
    </DetailSheetSection>
  );
}
