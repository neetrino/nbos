'use client';

import { useState } from 'react';
import {
  Building2,
  User,
  Calendar,
  FileText,
  FolderKanban,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { EntitySheet, StatusBadge } from '@/components/shared';
import { COMPANY_TYPES, TAX_STATUSES, getCompanyType, getTaxStatus } from '../constants/clients';
import type { Company } from '@/lib/api/clients';

interface CompanySheetProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete?: (id: string) => void;
}

export function CompanySheet({
  company,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: CompanySheetProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'LEGAL',
    taxId: '',
    legalAddress: '',
    notes: '',
  });

  if (!company) return null;

  const compType = getCompanyType(company.type);
  const taxStatus = getTaxStatus(company.taxStatus);

  const startEdit = () => {
    setForm({
      name: company.name,
      type: company.type,
      taxId: company.taxId ?? '',
      legalAddress: company.legalAddress ?? '',
      notes: company.notes ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(company.id, {
        name: form.name,
        type: form.type,
        taxId: form.taxId || null,
        legalAddress: form.legalAddress || null,
        notes: form.notes || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit Company' : company.name}
      badge={
        <div className="flex gap-1.5">
          {compType && <StatusBadge label={compType.label} variant={compType.variant} />}
          {taxStatus && <StatusBadge label={taxStatus.label} variant={taxStatus.variant} />}
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <div>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(company.id)}>
                <Trash2 size={14} />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEdit}>
                Edit
              </Button>
            )}
          </div>
        </div>
      }
    >
      {editing ? (
        <div className="space-y-4">
          <div>
            <Label>Company Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as string })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tax ID</Label>
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="Tax ID / VOEN"
              />
            </div>
          </div>
          <div>
            <Label>Legal Address</Label>
            <Input
              value={form.legalAddress}
              onChange={(e) => setForm({ ...form, legalAddress: e.target.value })}
              placeholder="Legal address..."
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Company Details
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-muted-foreground">Type</div>
              <div>
                {compType && <StatusBadge label={compType.label} variant={compType.variant} />}
              </div>
              <div className="text-muted-foreground">Tax Status</div>
              <div>
                {taxStatus && <StatusBadge label={taxStatus.label} variant={taxStatus.variant} />}
              </div>
              {company.taxId && (
                <>
                  <div className="text-muted-foreground">Tax ID</div>
                  <div className="font-mono font-medium">{company.taxId}</div>
                </>
              )}
              {company.legalAddress && (
                <>
                  <div className="text-muted-foreground">Address</div>
                  <div className="font-medium">{company.legalAddress}</div>
                </>
              )}
              <div className="text-muted-foreground">Created</div>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar size={13} />
                {new Date(company.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Primary Contact
            </h4>
            <div className="border-border flex items-center gap-3 rounded-lg border p-3 text-sm">
              <User size={14} className="text-muted-foreground" />
              <span className="font-medium">
                {company.contact.firstName} {company.contact.lastName}
              </span>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Activity
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <FolderKanban size={16} className="text-muted-foreground mx-auto" />
                <p className="mt-1 text-lg font-bold">{company._count.projects}</p>
                <p className="text-muted-foreground text-[10px]">Projects</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <FileText size={16} className="text-muted-foreground mx-auto" />
                <p className="mt-1 text-lg font-bold">{company._count.invoices}</p>
                <p className="text-muted-foreground text-[10px]">Invoices</p>
              </div>
            </div>
          </section>

          {company.notes && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Notes
                </h4>
                <div className="bg-secondary rounded-lg p-3 text-sm">
                  <MessageCircle size={13} className="text-muted-foreground mb-1 inline" />{' '}
                  {company.notes}
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </EntitySheet>
  );
}
