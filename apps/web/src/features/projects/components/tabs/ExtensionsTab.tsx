'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Puzzle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import { extensionsApi, type Extension } from '@/lib/api/extensions';
import {
  getExtensionStatus,
  getExtensionSize,
  EXTENSION_STATUSES,
} from '@/features/projects/constants/projects';

interface ExtensionsTabProps {
  projectId: string;
  onCreateClick: () => void;
}

export function ExtensionsTab({ projectId, onCreateClick }: ExtensionsTabProps) {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetchExtensions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await extensionsApi.getAll({
        projectId,
        pageSize: 50,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setExtensions(data.items);
    } catch {
      setExtensions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter]);

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updated = await extensionsApi.updateStatus(id, newStatus);
      setExtensions((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
    } catch {
      /* handled by API layer */
    }
  };

  const byStatus = (status: string) => extensions.filter((e) => e.status === status).length;
  const activeStatuses = ['NEW', 'DEVELOPMENT', 'QA', 'TRANSFER'];
  const doneCount = extensions.filter((e) => e.status === 'DONE').length;

  if (loading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">Loading extensions...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{extensions.length} extensions</span>
          {extensions.length > 0 && (
            <span className="text-muted-foreground text-xs">({doneCount} done)</span>
          )}
          <div className="flex gap-1">
            <Button
              variant={statusFilter === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(null)}
              className="h-7 text-xs"
            >
              All
            </Button>
            {EXTENSION_STATUSES.filter((s) => byStatus(s.value) > 0).map((s) => (
              <Button
                key={s.value}
                variant={statusFilter === s.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(s.value)}
                className="h-7 text-xs"
              >
                {s.label} ({byStatus(s.value)})
              </Button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={onCreateClick} className="gap-1.5">
          <Plus size={14} />
          New Extension
        </Button>
      </div>

      {extensions.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <Puzzle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No extensions in this project yet.</p>
          <Button variant="outline" size="sm" onClick={onCreateClick} className="mt-3 gap-1.5">
            <Plus size={14} />
            Create First Extension
          </Button>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Extension</th>
                <th className="px-4 py-2.5 text-left font-medium">Product</th>
                <th className="px-4 py-2.5 text-left font-medium">Size</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Assignee</th>
                <th className="px-4 py-2.5 text-left font-medium">Tasks</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {extensions.map((ext) => {
                const st = getExtensionStatus(ext.status);
                const sz = getExtensionSize(ext.size);
                const nextStatus = getNextStatus(ext.status);
                return (
                  <tr key={ext.id} className="border-border border-t">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{ext.name}</p>
                      {ext.description && (
                        <p className="text-muted-foreground max-w-[200px] truncate text-xs">
                          {ext.description}
                        </p>
                      )}
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 text-xs">
                      {ext.product?.name ?? '\u2014'}
                    </td>
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
                      {ext._count.tasks}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {nextStatus && activeStatuses.includes(ext.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleStatusChange(ext.id, nextStatus)}
                        >
                          → {EXTENSION_STATUSES.find((s) => s.value === nextStatus)?.label}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const STATUS_FLOW: Record<string, string> = {
  NEW: 'DEVELOPMENT',
  DEVELOPMENT: 'QA',
  QA: 'TRANSFER',
  TRANSFER: 'DONE',
};

function getNextStatus(current: string): string | null {
  return STATUS_FLOW[current] ?? null;
}
