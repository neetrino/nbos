'use client';

import { useState, useEffect, useCallback } from 'react';
import { List, Pencil, RefreshCcw, Tag, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader, EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/shared';
import { systemListsApi, type SystemListOption } from '@/lib/api/systemLists';

const LIST_KEY_LABELS: Record<string, string> = {
  PRODUCT_TYPE: 'Product Type',
};

const PROTECTED_LIST_KEYS = new Set(['PRODUCT_TYPE']);

function getListKeyLabel(key: string): string {
  return LIST_KEY_LABELS[key] ?? key.replace(/_/g, ' ');
}

export function SystemListsPage() {
  const [listKeys, setListKeys] = useState<string[]>([]);
  const [options, setOptions] = useState<SystemListOption[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<SystemListOption | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const data = await systemListsApi.getListKeys();
      const managed = data.map((r) => r.listKey).filter((k) => k in LIST_KEY_LABELS);
      setListKeys(managed);
      if (managed.length > 0 && !selectedKey) {
        setSelectedKey(managed[0]!);
      }
      setLoadError(null);
    } catch {
      setListKeys([]);
      setLoadError('System lists could not be loaded. Check your access and try again.');
    } finally {
      setLoadingKeys(false);
    }
  }, [selectedKey]);

  const fetchOptions = useCallback(async () => {
    if (!selectedKey) {
      setOptions([]);
      return;
    }
    setLoadingOptions(true);
    try {
      const data = await systemListsApi.getOptionsByKey(selectedKey, {
        includeInactive,
      });
      setOptions(data);
      setLoadError(null);
    } catch {
      setOptions([]);
      setLoadError('System list options could not be loaded. Check your access and try again.');
    } finally {
      setLoadingOptions(false);
    }
  }, [selectedKey, includeInactive]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const openEdit = (opt: SystemListOption) => {
    setEditingOption(opt);
    setFormLabel(opt.label);
    setFormSortOrder(opt.sortOrder);
    setFormActive(opt.isActive);
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingOption) return;
    const label = formLabel.trim();
    if (!label) {
      setError('Label is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await systemListsApi.update(editingOption.id, {
        label,
        sortOrder: formSortOrder,
        isActive: formActive,
      });
      setDialogOpen(false);
      fetchOptions();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="System Lists"
        description="Product Type labels and display order. Codes are managed by the system and cannot be changed."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchKeys();
            fetchOptions();
          }}
        >
          <RefreshCcw size={16} />
          Refresh
        </Button>
      </PageHeader>

      <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm font-medium">List:</span>
          {loadingKeys ? (
            <div className="w-full max-w-sm">
              <LoadingState count={1} />
            </div>
          ) : listKeys.length === 0 ? (
            <span className="text-muted-foreground text-sm">No configurable lists</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {listKeys.map((key) => (
                <Button
                  key={key}
                  variant={selectedKey === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedKey(key)}
                >
                  <Tag size={14} className="mr-1" />
                  {getListKeyLabel(key)}
                </Button>
              ))}
            </div>
          )}
          <label className="text-muted-foreground ml-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Include inactive
          </label>
        </div>

        <div className="bg-muted/50 flex items-start gap-2 rounded-lg px-3 py-2">
          <ShieldAlert size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-muted-foreground text-xs">
            You can edit <strong>labels</strong> and <strong>sort order</strong> for display
            purposes. Codes are system-managed and tied to business logic (auto-tasks, validations,
            workflows). To add or remove product types, contact a developer.
          </p>
        </div>

        {loadError ? (
          <ErrorState
            description={loadError}
            onRetry={() => {
              fetchKeys();
              fetchOptions();
            }}
          />
        ) : selectedKey ? (
          <>
            <div className="border-border border-t pt-3">
              <h3 className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                <List size={16} />
                {getListKeyLabel(selectedKey)} — {options.length} options
                {PROTECTED_LIST_KEYS.has(selectedKey) && (
                  <StatusBadge label="Protected" variant="amber" />
                )}
              </h3>
            </div>
            {loadingOptions ? (
              <LoadingState />
            ) : options.length === 0 ? (
              <EmptyState
                icon={List}
                title="No options"
                description={`No options found for ${getListKeyLabel(selectedKey)}.`}
              />
            ) : (
              <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead className="w-20">Order</TableHead>
                      <TableHead className="w-20">Active</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {options.map((opt) => (
                      <TableRow key={opt.id}>
                        <TableCell className="font-mono text-xs text-stone-500">
                          {opt.code}
                        </TableCell>
                        <TableCell>{opt.label}</TableCell>
                        <TableCell>{opt.sortOrder}</TableCell>
                        <TableCell>
                          {opt.isActive ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(opt)}
                          >
                            <Pencil size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit label
              {editingOption && (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  — {editingOption.code}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g. Website"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
              />
              <span className="text-sm">Active (shown in dropdowns)</span>
            </label>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SystemListsPage;
