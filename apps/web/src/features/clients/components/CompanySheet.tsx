'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Calendar,
  FileText,
  FolderKanban,
  Trash2,
  MessageCircle,
  LayoutDashboard,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { EntitySheet, SearchField, StatusBadge } from '@/components/shared';
import { COMPANY_TYPES, getCompanyType, getTaxStatus } from '../constants/clients';
import { clientPortfolioCompanyPath } from '../constants/client-routes';
import { cn } from '@/lib/utils';
import type { Company } from '@/lib/api/clients';
import { useContactSearchOptions } from '../hooks/use-contact-search-options';

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
  const searchContacts = useContactSearchOptions();
  const [form, setForm] = useState({
    name: '',
    type: 'LEGAL',
    taxId: '',
    legalAddress: '',
    notes: '',
    phone: '',
    email: '',
    country: '',
    primaryContactId: '',
    primaryContactLabel: '',
    billingContactId: '',
    billingContactLabel: '',
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
      phone: company.phone ?? '',
      email: company.email ?? '',
      country: company.country ?? '',
      primaryContactId: company.contact.id,
      primaryContactLabel: `${company.contact.firstName} ${company.contact.lastName}`.trim(),
      billingContactId: company.billingContact?.id ?? '',
      billingContactLabel: company.billingContact
        ? `${company.billingContact.firstName} ${company.billingContact.lastName}`.trim()
        : '',
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
        phone: form.phone || null,
        email: form.email || null,
        country: form.country || null,
        contactId: form.primaryContactId,
        billingContactId:
          form.billingContactId && form.billingContactId !== form.primaryContactId
            ? form.billingContactId
            : null,
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(company.id)}>
                <Trash2 size={14} />
                Delete
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!editing && (
              <>
                <Link
                  href={clientPortfolioCompanyPath(company.id)}
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'sm' }),
                    'inline-flex items-center gap-1.5',
                  )}
                >
                  <LayoutDashboard size={14} />
                  Open Portfolio
                </Link>
                <Button variant="outline" size="sm" onClick={startEdit}>
                  Edit
                </Button>
              </>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Company Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Country</Label>
            <Input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Country"
            />
          </div>
          <SearchField
            selectionMode="stage"
            label="Primary Contact *"
            value={form.primaryContactId}
            displayValue={
              form.primaryContactLabel ? (
                <span className="text-foreground font-medium">{form.primaryContactLabel}</span>
              ) : undefined
            }
            placeholder="Search contacts..."
            icon={<User size={12} />}
            maxResults={25}
            onSearch={searchContacts}
            onStageSelect={(id, label) =>
              setForm((prev) => ({
                ...prev,
                primaryContactId: id,
                primaryContactLabel: label,
              }))
            }
          />
          <SearchField
            selectionMode="stage"
            label="Billing Contact"
            value={form.billingContactId}
            displayValue={
              form.billingContactLabel ? (
                <span className="text-foreground font-medium">{form.billingContactLabel}</span>
              ) : undefined
            }
            placeholder="Optional — clear to use primary only"
            icon={<User size={12} />}
            maxResults={25}
            onSearch={searchContacts}
            onStageSelect={(id, label) =>
              setForm((prev) => ({
                ...prev,
                billingContactId: id,
                billingContactLabel: label,
              }))
            }
            onClear={() =>
              setForm((prev) => ({
                ...prev,
                billingContactId: '',
                billingContactLabel: '',
              }))
            }
          />
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
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !form.name || !form.primaryContactId}
            >
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
              {company.phone && (
                <>
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{company.phone}</div>
                </>
              )}
              {company.email && (
                <>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium">{company.email}</div>
                </>
              )}
              {company.country && (
                <>
                  <div className="text-muted-foreground">Country</div>
                  <div className="font-medium">{company.country}</div>
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
              Contacts
            </h4>
            <div className="border-border space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <User size={14} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Primary
                  </p>
                  <p className="font-medium">
                    {company.contact.firstName} {company.contact.lastName}
                  </p>
                </div>
              </div>
              <div className="border-border flex items-center gap-2 border-t pt-2">
                <User size={14} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Billing
                  </p>
                  <p className="font-medium">
                    {company.billingContact
                      ? `${company.billingContact.firstName} ${company.billingContact.lastName}`
                      : 'Same as primary'}
                  </p>
                </div>
              </div>
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
