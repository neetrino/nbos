'use client';

import { useState } from 'react';
import {
  Phone,
  Mail,
  User,
  Calendar,
  Clock,
  MessageSquare,
  ArrowRight,
  Snowflake,
  Trash2,
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
import {
  LEAD_STAGES,
  LEAD_SOURCES,
  INTEREST_TYPES,
  getLeadStage,
  getLeadSource,
} from '../constants/leadPipeline';
import type { Lead } from '@/lib/api/leads';

interface LeadSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Lead>) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onConvertToDeal?: (lead: Lead) => void;
  onDelete?: (id: string) => void;
}

export function LeadSheet({
  lead,
  open,
  onOpenChange,
  onUpdate,
  onStatusChange,
  onConvertToDeal,
  onDelete,
}: LeadSheetProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contactName: '',
    phone: '',
    email: '',
    source: '',
    notes: '',
  });

  if (!lead) return null;

  const stage = getLeadStage(lead.status);
  const source = getLeadSource(lead.source);
  const isTerminal = lead.status === 'SPAM' || lead.status === 'FROZEN' || lead.status === 'SQL';

  const nextActiveStage = (() => {
    const idx = LEAD_STAGES.findIndex((s) => s.key === lead.status);
    if (idx < 0) return null;
    const next = LEAD_STAGES[idx + 1];
    return next && !('terminal' in next) ? next : null;
  })();

  const startEdit = () => {
    setForm({
      contactName: lead.contactName,
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      source: lead.source,
      notes: lead.notes ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(lead.id, {
        contactName: form.contactName,
        phone: form.phone || null,
        email: form.email || null,
        source: form.source,
        notes: form.notes || null,
      } as Partial<Lead>);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit Lead' : lead.contactName}
      description={lead.code}
      badge={
        stage ? (
          <StatusBadge label={stage.label} variant={stage.variant} dot dotColor={stage.color} />
        ) : null
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(lead.id)}>
                <Trash2 size={14} />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!isTerminal && lead.status !== 'SQL' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange(lead.id, 'FROZEN')}
                >
                  <Snowflake size={14} />
                  Freeze
                </Button>
                {lead.status === 'MQL' && onConvertToDeal && (
                  <Button size="sm" onClick={() => onConvertToDeal(lead)}>
                    <ArrowRight size={14} />
                    Convert to Deal
                  </Button>
                )}
                {nextActiveStage && (
                  <Button size="sm" onClick={() => onStatusChange(lead.id, nextActiveStage.key)}>
                    <ArrowRight size={14} />
                    {nextActiveStage.label}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      }
    >
      {editing ? (
        <div className="space-y-4">
          <div>
            <Label>Contact Name *</Label>
            <Input
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              placeholder="John Smith"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+374..."
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <Label>Source</Label>
            <Select
              value={form.source || undefined}
              onValueChange={(v) => setForm({ ...form, source: v as string })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.icon} {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              placeholder="Any additional info..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.contactName}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={startEdit}>
              Edit
            </Button>
          </div>

          <section className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Contact Info
            </h4>
            <div className="space-y-2">
              {lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={14} className="text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="text-foreground hover:text-accent">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={14} className="text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-foreground hover:text-accent">
                    {lead.email}
                  </a>
                </div>
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Details
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-muted-foreground">Source</div>
              <div className="font-medium">
                {source?.icon} {source?.label ?? lead.source}
              </div>

              <div className="text-muted-foreground">Seller</div>
              <div className="font-medium">
                {lead.assignee ? (
                  <div className="flex items-center gap-1.5">
                    <User size={13} />
                    {lead.assignee.firstName} {lead.assignee.lastName}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>

              <div className="text-muted-foreground">Created</div>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar size={13} />
                {new Date(lead.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>

              <div className="text-muted-foreground">Updated</div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock size={13} />
                {new Date(lead.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </section>

          {lead.notes && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Notes
                </h4>
                <div className="bg-secondary text-foreground rounded-lg p-3 text-sm">
                  <MessageSquare size={13} className="text-muted-foreground mb-1 inline" />{' '}
                  {lead.notes}
                </div>
              </section>
            </>
          )}

          {lead.deal && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Linked Deal
                </h4>
                <div className="border-border rounded-lg border p-3 text-sm">
                  <span className="text-foreground font-medium">{lead.deal.code}</span>
                  <StatusBadge
                    label={lead.deal.status.replace(/_/g, ' ')}
                    variant="blue"
                    className="ml-2"
                  />
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </EntitySheet>
  );
}
