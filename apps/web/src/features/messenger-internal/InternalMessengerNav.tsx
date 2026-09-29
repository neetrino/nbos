'use client';

import { useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  SlidingPillBackdrop,
  useSlidingPillIndicator,
} from '@/components/shared/page-hero/sliding-pill-indicator';
import {
  INTERNAL_MESSENGER_SECTIONS,
  type InternalMessengerSectionId,
} from './internal-messenger.constants';

const SECTION_LABEL: Record<InternalMessengerSectionId, string> = {
  all: 'All',
  products: 'Products',
  tasks: 'Tasks',
  deals: 'Deals',
  workspaces: 'Workspace',
  groups: 'Groups',
  direct: 'Direct',
  collections: 'Collection',
};

const SECTION_TAB_CLASS =
  'relative z-10 shrink-0 rounded-full px-3 py-2 text-xs leading-[18px] font-medium transition-colors duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

const SECTION_STRIP_CLASS =
  'relative flex min-w-0 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function InternalMessengerNav({
  section,
  onSectionChange,
}: {
  section: InternalMessengerSectionId;
  onSectionChange?: (section: InternalMessengerSectionId) => void;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const getActiveElement = useCallback(() => itemRefs.current.get(section), [section]);
  const { indicator, ready } = useSlidingPillIndicator(groupRef, getActiveElement, section, false);

  return (
    <nav
      aria-label="Internal Messenger"
      className="flex h-12 shrink-0 items-center border-b border-[#f1f5f9] bg-[#fafbfc] px-6"
    >
      <div ref={groupRef} className={SECTION_STRIP_CLASS}>
        <SlidingPillBackdrop
          indicator={indicator}
          ready={ready}
          className="top-0 bottom-0 bg-[#4f46e5]"
        />
        {INTERNAL_MESSENGER_SECTIONS.map((item) => (
          <SectionTab
            key={item.id}
            id={item.id}
            href={item.href}
            active={item.id === section}
            onSectionChange={onSectionChange}
            onReveal={() => revealTab(groupRef.current, itemRefs.current.get(item.id))}
            itemRef={(node) => rememberTab(itemRefs.current, item.id, node)}
          />
        ))}
      </div>
    </nav>
  );
}

function rememberTab(refs: Map<string, HTMLElement>, id: string, node: HTMLElement | null) {
  if (node) refs.set(id, node);
  else refs.delete(id);
}

/** Scroll only the tab strip. `scrollIntoView` also moves the sheet and fights the pill. */
function revealTab(container: HTMLElement | null, tab: HTMLElement | undefined) {
  if (!container || !tab) return;
  const tabLeft = tab.offsetLeft;
  const tabRight = tabLeft + tab.offsetWidth;
  const viewRight = container.scrollLeft + container.clientWidth;
  if (tabLeft < container.scrollLeft) {
    container.scrollLeft = tabLeft;
    return;
  }
  if (tabRight > viewRight) container.scrollLeft = tabRight - container.clientWidth;
}

function SectionTab({
  id,
  href,
  active,
  onSectionChange,
  onReveal,
  itemRef,
}: {
  id: InternalMessengerSectionId;
  href: string;
  active: boolean;
  onSectionChange?: (section: InternalMessengerSectionId) => void;
  onReveal: () => void;
  itemRef: (node: HTMLElement | null) => void;
}) {
  const className = `${SECTION_TAB_CLASS} ${
    active ? 'text-white' : 'text-[#64748b] hover:text-[#0f172a]'
  }`;
  if (onSectionChange) {
    return (
      <button
        ref={itemRef}
        type="button"
        aria-current={active ? 'page' : undefined}
        className={className}
        onClick={() => {
          onReveal();
          onSectionChange(id);
        }}
      >
        {SECTION_LABEL[id]}
      </button>
    );
  }
  return (
    <Link
      ref={itemRef}
      href={href}
      aria-current={active ? 'page' : undefined}
      className={className}
    >
      {SECTION_LABEL[id]}
    </Link>
  );
}
