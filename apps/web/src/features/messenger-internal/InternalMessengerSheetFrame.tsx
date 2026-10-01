'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SHEET_PANEL_CLASS =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-[var(--shadow-panel)]';

export function InternalMessengerSheetFrame({
  embedded,
  children,
}: {
  embedded: boolean;
  children: ReactNode;
}) {
  if (embedded) {
    return (
      <div className="bg-card text-card-foreground flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    );
  }
  return (
    <div className="flex h-full min-h-0 bg-gradient-to-b from-[#f1f5f9] to-[#3766be]">
      <SheetCloseButton />
      <div className={SHEET_PANEL_CLASS}>{children}</div>
    </div>
  );
}

function SheetCloseButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Close messenger"
      onClick={() => router.back()}
      className="mt-8 mr-1 flex size-8 shrink-0 items-center justify-center rounded-l-full bg-[#4f46e5] text-white"
    >
      <X size={16} />
    </button>
  );
}
