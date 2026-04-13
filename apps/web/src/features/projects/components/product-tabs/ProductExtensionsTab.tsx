'use client';

import { User, Puzzle } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { ProductExtensionRef } from '@/lib/api/products';
import { getExtensionStatus, getExtensionSize } from '@/features/projects/constants/projects';

interface ProductExtensionsTabProps {
  extensions: ProductExtensionRef[];
}

export function ProductExtensionsTab({ extensions }: ProductExtensionsTabProps) {
  if (extensions.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        <Puzzle size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No extensions linked to this product.</p>
      </div>
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Extension</th>
            <th className="px-4 py-2.5 text-left font-medium">Size</th>
            <th className="px-4 py-2.5 text-left font-medium">Status</th>
            <th className="px-4 py-2.5 text-left font-medium">Assignee</th>
            <th className="px-4 py-2.5 text-left font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {extensions.map((ext) => {
            const st = getExtensionStatus(ext.status);
            const sz = getExtensionSize(ext.size);
            return (
              <tr key={ext.id} className="border-border border-t">
                <td className="px-4 py-2.5 font-medium">{ext.name}</td>
                <td className="px-4 py-2.5">
                  {sz && <StatusBadge label={sz.label} variant={sz.variant} />}
                </td>
                <td className="px-4 py-2.5">
                  {st && <StatusBadge label={st.label} variant={st.variant} />}
                </td>
                <td className="px-4 py-2.5">
                  {ext.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-muted-foreground" />
                      <span className="text-xs">
                        {ext.assignee.firstName} {ext.assignee.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">{'\u2014'}</span>
                  )}
                </td>
                <td className="text-muted-foreground px-4 py-2.5 text-xs">
                  {new Date(ext.createdAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
