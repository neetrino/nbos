'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

export function ModuleNavTrigger({
  messenger,
  href,
  className,
  title,
  active,
  onActivate,
  children,
}: {
  messenger: boolean;
  href: string;
  className: string;
  title?: string;
  active: boolean;
  onActivate: () => void;
  children: ReactNode;
}) {
  const activeAttr = active ? 'true' : undefined;
  if (messenger) {
    return (
      <button
        type="button"
        title={title}
        data-sidebar-nav-active={activeAttr}
        className={className}
        onClick={onActivate}
      >
        {children}
      </button>
    );
  }
  return (
    <Link
      href={href}
      title={title}
      data-sidebar-nav-active={activeAttr}
      className={className}
      onClick={onActivate}
    >
      {children}
    </Link>
  );
}
