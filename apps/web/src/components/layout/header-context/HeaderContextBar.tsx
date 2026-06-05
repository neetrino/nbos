'use client';

import { useHeaderContextResolved } from './HeaderContextProvider';
import { HeaderContextNav } from './HeaderContextNav';

export function HeaderContextBar() {
  const content = useHeaderContextResolved();

  if (!content) {
    return null;
  }

  switch (content.kind) {
    case 'nav':
      return (
        <HeaderContextNav
          items={content.items}
          ariaLabel={content.ariaLabel}
          className="min-w-0 flex-1 self-stretch"
        />
      );
    case 'actions':
      return (
        <div
          className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2"
          role={content.ariaLabel ? 'toolbar' : undefined}
          aria-label={content.ariaLabel}
        >
          {content.children}
        </div>
      );
    case 'custom':
      return <div className="flex min-w-0 flex-1 items-center self-stretch">{content.node}</div>;
    default: {
      const _exhaustive: never = content;
      return _exhaustive;
    }
  }
}
