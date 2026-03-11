'use client';

import { useState } from 'react';
import {
  DollarSign,
  User,
  Building2,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  Link2,
  ArrowRight,
  Trash2,
  CheckCircle2,
  XCircle,
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
  DEAL_STAGES,
  DEAL_TYPES,
  PAYMENT_TYPES,
  getDealStage,
  formatAmount,
} from '../constants/dealPipeline';
import type { Deal } from '@/lib/api/deals';

interface DealSheetProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete?: (id: string) => void;
}

export function DealSheet({
  deal,
  open,
  onOpenChange,
  onUpdate,
  onStatusChange,
  onDelete,
}: DealSheetProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: '',
    amount: '',
    paymentType: '',
    notes: '',
  });

  if (!deal) return null;

  const stage = getDealStage(deal.status);
  const isTerminal = deal.status === 'FAILED' || deal.status === 'WON';

  const nextStage = (() => {
    const idx = DEAL_STAGES.findIndex((s) => s.key === deal.status);
    if (idx < 0) return null;
    const next = DEAL_STAGES[idx + 1];
    return next && !('terminal' in next) ? next : null;
  })();

  const startEdit = () => {
    setForm({
      type: deal.type,
      amount: deal.amount?.toString() ?? '',
      paymentType: deal.paymentType ?? '',
      notes: deal.notes ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(deal.id, {
        type: form.type,
        amount: form.amount ? Number(form.amount) : null,
        paymentType: form.paymentType || null,
        notes: form.notes || null,
      } as Partial<Deal>);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const stageProgress = (() => {
    const activeStages = DEAL_STAGES.filter((s) => !('terminal' in s));
    const idx = activeStages.findIndex((s) => s.key === deal.status);
    if (idx < 0) return 100;
    return Math.round(((idx + 1) / activeStages.length) * 100);
  })();

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit Deal' : `${deal.contact?.firstName} ${deal.contact?.lastName}`}
      description={deal.code}
      badge={
        stage ? (
          <StatusBadge label={stage.label} variant={stage.variant} dot dotColor={stage.color} />
        ) : null
      }
      footer={
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(deal.id)}>
                <Trash2 size={14} />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!isTerminal && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => onStatusChange(deal.id, 'FAILED')}
                >
                  <XCircle size={14} />
                  Failed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600"
                  onClick={() => onStatusChange(deal.id, 'WON')}
                >
                  <CheckCircle2 size={14} />
                  Won
                </Button>
                {nextStage && (
                  <Button size="sm" onClick={() => onStatusChange(deal.id, nextStage.key)}>
                    <ArrowRight size={14} />
                    {nextStage.label}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Deal Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as string })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Type</Label>
              <Select
                value={form.paymentType || undefined}
                onValueChange={(v) => setForm({ ...form, paymentType: v as string })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Amount (AMD)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="e.g. 1500000"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              placeholder="Scope, requirements, details..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
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

          {!isTerminal && (
            <section>
              <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                Pipeline Progress
              </h4>
              <div className="bg-secondary h-2 overflow-hidden rounded-full">
                <div
                  className="bg-accent h-full rounded-full transition-all"
                  style={{ width: `${stageProgress}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{stageProgress}% complete</p>
            </section>
          )}

          <Separator />

          <section className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Deal Info
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-muted-foreground">Amount</div>
              <div className="text-foreground flex items-center gap-1.5 text-lg font-bold">
                <DollarSign size={16} className="text-accent" />
                {formatAmount(deal.amount)}
              </div>

              <div className="text-muted-foreground">Type</div>
              <div>
                <StatusBadge
                  label={deal.type.replace(/_/g, ' ')}
                  variant={deal.type === 'EXTENSION' ? 'blue' : 'default'}
                />
              </div>

              <div className="text-muted-foreground">Payment</div>
              <div className="font-medium">{deal.paymentType?.replace(/_/g, ' ') ?? '—'}</div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Contact & Company
            </h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-muted-foreground">Contact</div>
              <div className="flex items-center gap-1.5 font-medium">
                <User size={13} />
                {deal.contact?.firstName} {deal.contact?.lastName}
              </div>

              <div className="text-muted-foreground">Seller</div>
              <div className="flex items-center gap-1.5 font-medium">
                <User size={13} />
                {deal.seller?.firstName} {deal.seller?.lastName}
              </div>

              <div className="text-muted-foreground">Created</div>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar size={13} />
                {new Date(deal.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>

              <div className="text-muted-foreground">Updated</div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock size={13} />
                {new Date(deal.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </section>

          {deal.notes && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Notes
                </h4>
                <div className="bg-secondary text-foreground rounded-lg p-3 text-sm">
                  <MessageSquare size={13} className="text-muted-foreground mb-1 inline" />{' '}
                  {deal.notes}
                </div>
              </section>
            </>
          )}

          {deal.lead && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Source Lead
                </h4>
                <div className="border-border flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <Link2 size={14} className="text-muted-foreground" />
                  <span className="font-medium">{deal.lead.code}</span>
                  <span className="text-muted-foreground">— {deal.lead.contactName}</span>
                </div>
              </section>
            </>
          )}

          {deal.orders.length > 0 && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Orders ({deal.orders.length})
                </h4>
                <div className="space-y-2">
                  {deal.orders.map((order) => (
                    <div
                      key={order.id}
                      className="border-border flex items-center justify-between rounded-lg border p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-muted-foreground" />
                        <span className="font-medium">{order.code}</span>
                        <StatusBadge label={order.status.replace(/_/g, ' ')} variant="blue" />
                      </div>
                      <span className="font-medium">{formatAmount(order.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </EntitySheet>
  );
}
