'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  User,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  Link2,
  Trash2,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Building2,
  CreditCard,
  Tag,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EntitySheet, StatusBadge, InlineField } from '@/components/shared';
import {
  DEAL_STAGES,
  DEAL_TYPES,
  PAYMENT_TYPES,
  getDealStage,
  formatAmount,
} from '../constants/dealPipeline';
import type { Deal } from '@/lib/api/deals';
import { contactsApi, type Contact } from '@/lib/api/clients';
import { cn } from '@/lib/utils';

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
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (open) {
      contactsApi
        .getAll({ pageSize: 200 })
        .then((d) => setContacts(d.items))
        .catch(() => {});
    }
  }, [open]);

  if (!deal) return null;

  const stage = getDealStage(deal.status);
  const isTerminal = deal.status === 'FAILED' || deal.status === 'WON';
  const activeStages = DEAL_STAGES.filter((s) => !('terminal' in s));
  const currentIdx = activeStages.findIndex((s) => s.key === deal.status);

  const saveField = async (field: string, value: string) => {
    const payload: Record<string, unknown> = {};
    if (field === 'amount') {
      payload[field] = value ? Number(value) : null;
    } else {
      payload[field] = value || null;
    }
    await onUpdate(deal.id, payload as Partial<Deal>);
  };

  return (
    <EntitySheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title=""
      footer={
        <div className="flex items-center justify-between">
          <div>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(deal.id)}>
                <Trash2 size={14} className="mr-1" />
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
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onStatusChange(deal.id, 'FAILED')}
                >
                  <XCircle size={14} className="mr-1" />
                  Failed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-emerald-600 hover:bg-emerald-500/10"
                  onClick={() => onStatusChange(deal.id, 'WON')}
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  Won
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-foreground text-xl font-bold">
                {deal.contact?.firstName} {deal.contact?.lastName}
              </h2>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-sm">
                <span className="font-mono">{deal.code}</span>
                {stage && (
                  <>
                    <span>·</span>
                    <StatusBadge
                      label={stage.label}
                      variant={stage.variant}
                      dot
                      dotColor={stage.color}
                    />
                  </>
                )}
              </div>
            </div>
            {deal.amount != null && (
              <div className="text-right">
                <p className="text-2xl font-bold">{formatAmount(deal.amount)}</p>
                <p className="text-muted-foreground text-xs">Deal value</p>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Stages */}
        {!isTerminal && (
          <div className="border-border/50 bg-muted/30 rounded-xl border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Pipeline
              </span>
              <span className="text-muted-foreground text-xs">
                Step {currentIdx + 1} of {activeStages.length}
              </span>
            </div>
            <div className="flex gap-1">
              {activeStages.map((s, i) => {
                const isCurrent = s.key === deal.status;
                const isPast = i < currentIdx;
                return (
                  <button
                    key={s.key}
                    onClick={() => onStatusChange(deal.id, s.key)}
                    title={s.label}
                    className={cn(
                      'relative h-2 flex-1 rounded-full transition-all hover:opacity-80',
                      isCurrent ? s.color : isPast ? s.color + ' opacity-60' : 'bg-border',
                    )}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-foreground text-xs font-medium">{stage?.label}</span>
              {currentIdx < activeStages.length - 1 && (
                <button
                  onClick={() => onStatusChange(deal.id, activeStages[currentIdx + 1].key)}
                  className="text-accent flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  Next: {activeStages[currentIdx + 1].label}
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {isTerminal && (
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4',
              deal.status === 'WON'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
            )}
          >
            {deal.status === 'WON' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            <div>
              <p className="font-semibold">{deal.status === 'WON' ? 'Deal Won' : 'Deal Failed'}</p>
              <p className="text-xs opacity-80">
                {deal.status === 'WON'
                  ? 'This deal was successfully closed'
                  : 'This deal did not go through'}
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {/* Financial Section */}
          <div className="col-span-2 mb-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <DollarSign size={13} />
              Financial
            </h3>
          </div>

          <InlineField
            label="Amount"
            value={deal.amount}
            displayValue={
              deal.amount != null ? (
                <span className="text-foreground text-lg font-bold">
                  {formatAmount(deal.amount)}
                </span>
              ) : undefined
            }
            type="number"
            placeholder="Enter amount..."
            icon={<DollarSign size={12} />}
            onSave={(v) => saveField('amount', v)}
          />

          <InlineField
            label="Deal Type"
            value={deal.type}
            displayValue={
              <StatusBadge
                label={DEAL_TYPES.find((t) => t.value === deal.type)?.label ?? deal.type}
                variant={
                  deal.type === 'EXTENSION' ? 'blue' : deal.type === 'UPSELL' ? 'purple' : 'default'
                }
              />
            }
            type="select"
            options={DEAL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            icon={<Tag size={12} />}
            onSave={(v) => saveField('type', v)}
          />

          <InlineField
            label="Payment Type"
            value={deal.paymentType}
            displayValue={
              deal.paymentType ? (
                <span className="text-foreground font-medium">
                  {PAYMENT_TYPES.find((p) => p.value === deal.paymentType)?.label ??
                    deal.paymentType?.replace(/_/g, ' ')}
                </span>
              ) : undefined
            }
            type="select"
            options={PAYMENT_TYPES.map((p) => ({ value: p.value, label: p.label }))}
            placeholder="Select payment type..."
            icon={<CreditCard size={12} />}
            onSave={(v) => saveField('paymentType', v)}
          />

          <InlineField
            label="Source"
            value={deal.source}
            displayValue={
              deal.source ? (
                <span className="text-foreground font-medium">
                  {deal.source.replace(/_/g, ' ')}
                </span>
              ) : undefined
            }
            type="text"
            placeholder="Lead source..."
            icon={<ExternalLink size={12} />}
            editable={false}
          />

          {/* Contact & Team Section */}
          <div className="col-span-2 mt-4 mb-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <User size={13} />
              Contact & Team
            </h3>
          </div>

          <InlineField
            label="Contact"
            value={deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : ''}
            displayValue={
              deal.contact ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {deal.contact.firstName[0]}
                    {deal.contact.lastName[0]}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </p>
                    {deal.contact.email && (
                      <p className="text-muted-foreground text-[11px]">{deal.contact.email}</p>
                    )}
                  </div>
                </div>
              ) : undefined
            }
            type="select"
            options={contacts.map((c) => ({
              value: c.id,
              label: `${c.firstName} ${c.lastName}`,
            }))}
            placeholder="Select contact..."
            icon={<User size={12} />}
            onSave={(v) => saveField('contactId', v)}
          />

          <InlineField
            label="Seller"
            value={deal.seller ? `${deal.seller.firstName} ${deal.seller.lastName}` : ''}
            displayValue={
              deal.seller ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                    {deal.seller.firstName[0]}
                    {deal.seller.lastName[0]}
                  </div>
                  <span className="text-foreground text-sm font-medium">
                    {deal.seller.firstName} {deal.seller.lastName}
                  </span>
                </div>
              ) : undefined
            }
            editable={false}
            icon={<Building2 size={12} />}
          />

          {/* Dates Section */}
          <div className="col-span-2 mt-4 mb-2">
            <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <Calendar size={13} />
              Dates
            </h3>
          </div>

          <InlineField
            label="Created"
            value={new Date(deal.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            icon={<Calendar size={12} />}
            editable={false}
          />

          <InlineField
            label="Last Updated"
            value={new Date(deal.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            icon={<Clock size={12} />}
            editable={false}
          />
        </div>

        {/* Notes */}
        <Separator />
        <InlineField
          label="Notes"
          value={deal.notes}
          type="textarea"
          placeholder="Add notes about this deal..."
          icon={<MessageSquare size={12} />}
          onSave={(v) => saveField('notes', v)}
        />

        {/* Linked Entities */}
        {deal.lead && (
          <>
            <Separator />
            <div>
              <h3 className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                <Link2 size={13} />
                Source Lead
              </h3>
              <div className="border-border hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-3 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <User size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{deal.lead.contactName}</p>
                  <p className="text-muted-foreground text-xs">{deal.lead.code}</p>
                </div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </div>
            </div>
          </>
        )}

        {deal.orders.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                <FileText size={13} />
                Orders ({deal.orders.length})
              </h3>
              <div className="space-y-2">
                {deal.orders.map((order) => (
                  <div
                    key={order.id}
                    className="border-border hover:bg-muted/50 flex items-center justify-between rounded-xl border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.code}</p>
                        <StatusBadge label={order.status.replace(/_/g, ' ')} variant="blue" />
                      </div>
                    </div>
                    <span className="text-foreground font-semibold">
                      {formatAmount(order.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </EntitySheet>
  );
}
