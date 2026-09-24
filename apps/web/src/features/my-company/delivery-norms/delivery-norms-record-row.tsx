import type { ReactNode } from 'react';
import { RECORD_ROW_CLASS } from './delivery-norms.constants';

export function DeliveryNormsRecordRow({ children }: { children: ReactNode }) {
  return <li className={RECORD_ROW_CLASS}>{children}</li>;
}
