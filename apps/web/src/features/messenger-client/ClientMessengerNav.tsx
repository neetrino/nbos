'use client';

import Link from 'next/link';
import {
  CLIENT_MESSENGER_SECTIONS,
  type ClientMessengerSectionId,
} from './client-messenger.constants';

export function ClientMessengerNav({ section }: { section: ClientMessengerSectionId }) {
  return (
    <nav
      aria-label="Client Messenger"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-teal-900/10 px-3 py-2"
    >
      {CLIENT_MESSENGER_SECTIONS.map((item) => {
        const active = item.id === section;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-teal-800/15 text-teal-950'
                : 'text-black/55 hover:bg-teal-900/[0.04] hover:text-black'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
