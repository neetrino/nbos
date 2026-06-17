'use client';

import { cn } from '@/lib/utils';
import { DocumentsSidebar } from '@/features/documents/DocumentsSidebar';
import { DocumentFavoritesProvider } from '@/features/documents/DocumentFavoritesContext';
import { useDocumentsSidebarResize } from '@/features/documents/use-documents-sidebar-resize';
import { DOCS_SIDEBAR_RESIZE_HIT_PX } from '@/features/documents/documents-sidebar-resize-constants';

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  const {
    containerRef,
    sidebarWidthPx,
    isDragging,
    isResizeEnabled,
    handlePointerDown,
    handleKeyDown,
  } = useDocumentsSidebarResize();

  return (
    <DocumentFavoritesProvider>
      <div
        ref={containerRef}
        className={cn('flex h-full min-h-0 overflow-hidden', isDragging && 'select-none')}
      >
        <DocumentsSidebar style={{ width: sidebarWidthPx, minWidth: sidebarWidthPx }} />

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize documents sidebar"
          aria-valuenow={sidebarWidthPx}
          tabIndex={isResizeEnabled ? 0 : -1}
          onPointerDown={isResizeEnabled ? handlePointerDown : undefined}
          onKeyDown={isResizeEnabled ? handleKeyDown : undefined}
          className={cn(
            'group relative z-[45] h-full shrink-0 touch-none',
            'bg-border',
            isResizeEnabled && 'cursor-col-resize',
            isDragging && 'bg-primary/40',
          )}
          style={{ width: DOCS_SIDEBAR_RESIZE_HIT_PX }}
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2',
              'bg-border',
              isDragging && 'bg-primary/40',
            )}
          />
          <span className="sr-only">Drag to resize documents sidebar</span>
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </DocumentFavoritesProvider>
  );
}
