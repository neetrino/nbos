import type { ReactNode } from 'react';
import { DialogFooter } from '@/components/ui/dialog';

export function CrmCreateFormActionBar({
  isMobile,
  children,
}: {
  isMobile: boolean;
  children: ReactNode;
}) {
  if (isMobile) return <div className="flex flex-col-reverse gap-2">{children}</div>;
  return <DialogFooter>{children}</DialogFooter>;
}
