'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SHEET_PANEL_CLASS =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]';

export function InternalMessengerSheetFrame({
  embedded,
  children,
}: {
  embedded: boolean;
  children: ReactNode;
}) {
  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">{children}</div>
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
