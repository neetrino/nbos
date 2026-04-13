'use client';

import { Phone } from 'lucide-react';

export function DealCallsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800/40">
        <Phone size={24} className="text-stone-400" />
      </div>
      <h3 className="text-foreground mb-1.5 text-sm font-semibold">Calls & Recordings</h3>
      <p className="text-muted-foreground max-w-[280px] text-xs leading-relaxed">
        Phone calls and recordings with the client will sync here from your telephony provider,
        organized by date
      </p>
    </div>
  );
}
