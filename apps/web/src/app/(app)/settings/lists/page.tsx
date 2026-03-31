'use client';

import { useState, useEffect, useCallback } from 'react';
import { List, Plus, Pencil, Trash2, RefreshCcw, ChevronDown, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { PageHeader, EmptyState } from '@/components/shared';
import { systemListsApi, type SystemListOption } from '@/lib/api/systemLists';

const LIST_KEY_LABELS: Record<string, string> = {
  PRODUCT_TYPE: 'Product Type',
  DEAL_TYPE: 'Deal Type',
  PAYMENT_TYPE: 'Payment Type',
  EXTENSION_SIZE: 'Extension Size',
};

function getListKeyLabel(key: string): string {
  return LIST_KEY_LABELS[key] ?? key.replace(/_/g, ' ');
}

export default function SystemListsPage() {
  const [listKeys, setListKeys] = useState<string[]>([]);
  const [options, setOptions] = useState<SystemListOption[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<SystemListOption | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const data = await systemListsApi.getListKeys();
      setListKeys(data.map((r) => r.listKey));
      if (data.length > 0 && !selectedKey) {
        setSelectedKey(data[0]!.listKey);
      }
    } catch {
      setListKeys([]);
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
    } catch {
      setOptions([]);
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

  const openCreate = () => {
    setEditingOption(null);
    setFormCode('');
    setFormLabel('');
    setFormSortOrder(options.length);
    setFormActive(true);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (opt: SystemListOption) => {
    setEditingOption(opt);
    setFormCode(opt.code);
    setFormLabel(opt.label);
    setFormSortOrder(opt.sortOrder);
    setFormActive(opt.isActive);
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedKey) return;
    const code = formCode.trim().toUpperCase().replace(/\s+/g, '_');
    const label = formLabel.trim();
    if (!code || !label) {
      setError('Code and label are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingOption) {
        await systemListsApi.update(editingOption.id, {
          code,
          label,
          sortOrder: formSortOrder,
          isActive: formActive,
        });
      } else {
        await systemListsApi.create({
          listKey: selectedKey,
          code,
          label,
          sortOrder: formSortOrder,
          isActive: formActive,
        });
      }
      setDialogOpen(false);
      fetchOptions();
      fetchKeys();
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this option? It may be used in Deals or other modules.')) return;
    try {
      await systemListsApi.delete(id);
      fetchOptions();
      fetchKeys();
    } catch {
      /* toast or setError */
    }
  };

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="System Lists"
        description="Reference lists for Product Type, Deal Type, Payment Type, and others. Used in CRM, Finance, and across the app."
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
        <Button size="sm" disabled={!selectedKey} onClick={openCreate}>
          <Plus size={16} />
          Add option
        </Button>
      </PageHeader>

      <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-muted-foreground text-sm font-medium">List:</span>
          {loadingKeys ? (
            <Skeleton className="h-9 w-48 rounded-lg" />
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

        {selectedKey && (
          <>
            <div className="border-border border-t pt-3">
              <h3 className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                <List size={16} />
                {getListKeyLabel(selectedKey)} — {options.length} options
              </h3>
            </div>
            {loadingOptions ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : options.length === 0 ? (
              <EmptyState
                icon={List}
                title="No options"
                description={`Add options for ${getListKeyLabel(selectedKey)}. They will appear in dropdowns across the app.`}
                action={
                  <Button onClick={openCreate}>
                    <Plus size={16} /> Add first option
                  </Button>
                }
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
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {options.map((opt) => (
                      <TableRow key={opt.id}>
                        <TableCell className="font-mono text-sm">{opt.code}</TableCell>
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
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(opt)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(opt.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOption ? 'Edit option' : 'Add option'}
              {selectedKey && (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  — {getListKeyLabel(selectedKey)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="e.g. WEBSITE"
                disabled={!!editingOption}
                className="font-mono"
              />
              {editingOption && (
                <p className="text-muted-foreground text-xs">
                  Code cannot be changed when editing.
                </p>
              )}
            </div>
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
            {editingOption && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                />
                <span className="text-sm">Active (shown in dropdowns)</span>
              </label>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingOption ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
