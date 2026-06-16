'use client';

import { DocumentsSidebar } from '@/features/documents/DocumentsSidebar';
import { DocumentFavoritesProvider } from '@/features/documents/DocumentFavoritesContext';

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocumentFavoritesProvider>
      <div className="flex h-full min-h-0 overflow-hidden">
        <DocumentsSidebar />
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </DocumentFavoritesProvider>
  );
}
