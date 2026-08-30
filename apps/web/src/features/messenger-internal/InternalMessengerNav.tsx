'use client';

import Link from 'next/link';
import {
  INTERNAL_MESSENGER_SECTIONS,
  type InternalMessengerSectionId,
} from './internal-messenger.constants';

export function InternalMessengerNav({ section }: { section: InternalMessengerSectionId }) {
  return (
    <nav
      aria-label="Internal Messenger"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-black/[0.06] px-3 py-2"
    >
      {INTERNAL_MESSENGER_SECTIONS.map((item) => {
        const active = item.id === section;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-[#E5A84B]/15 text-black'
                : 'text-black/55 hover:bg-black/[0.04] hover:text-black'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
