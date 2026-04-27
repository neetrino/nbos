'use client';

import { useState } from 'react';
import {
  Phone,
  Mail,
  User,
  Building2,
  Calendar,
  MessageCircle,
  FolderKanban,
  Handshake,
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
import { CONTACT_ROLES, PREFERRED_CHANNELS, getContactRole } from '../constants/clients';
import type { Contact } from '@/lib/api/clients';

interface ContactSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete?: (id: string) => void;
}

export function ContactSheet({
  contact,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: ContactSheetProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: 'CLIENT',
    preferredChannel: '',
    language: '',
    notes: '',
  });

  if (!contact) return null;

  const role = getContactRole(contact.role);

  const startEdit = () => {
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone ?? '',
      email: contact.email ?? '',
      role: contact.role,
      preferredChannel: (contact.messengerLinks as Record<string, string>)?.preferredChannel ?? '',
      language: (contact.messengerLinks as Record<string, string>)?.language ?? '',
      notes: contact.notes ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(contact.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        email: form.email || null,
        role: form.role,
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
      title={editing ? 'Edit Contact' : `${contact.firstName} ${contact.lastName}`}
      badge={role ? <StatusBadge label={role.label} variant={role.variant} /> : null}
      footer={
        <div className="flex items-center justify-between">
          <div>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(contact.id)}>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone *</Label>
              <Input
                type="tel"
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
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as string })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred Channel</Label>
              <Select
                value={form.preferredChannel || undefined}
                onValueChange={(v) => setForm({ ...form, preferredChannel: v as string })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PREFERRED_CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Preferences, important details..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !form.firstName || !form.lastName}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Contact Info
            </h4>
            <div className="space-y-2">
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={14} className="text-muted-foreground" />
                  <a href={`tel:${contact.phone}`} className="hover:text-accent">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={14} className="text-muted-foreground" />
                  <a href={`mailto:${contact.email}`} className="hover:text-accent">
                    {contact.email}
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
              <div className="text-muted-foreground">Role</div>
              <div>{role && <StatusBadge label={role.label} variant={role.variant} />}</div>
              <div className="text-muted-foreground">Created</div>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar size={13} />
                {new Date(contact.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </section>

          {contact.companies.length > 0 && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Companies ({contact.companies.length})
                </h4>
                <div className="space-y-2">
                  {contact.companies.map((company) => (
                    <div
                      key={company.id}
                      className="border-border flex items-center gap-2 rounded-lg border p-3 text-sm"
                    >
                      <Building2 size={14} className="text-muted-foreground" />
                      <span className="font-medium">{company.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <Separator />

          <section className="space-y-2">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Activity
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <FolderKanban size={16} className="text-muted-foreground mx-auto" />
                <p className="mt-1 text-lg font-bold">{contact._count.projects}</p>
                <p className="text-muted-foreground text-[10px]">Projects</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <User size={16} className="text-muted-foreground mx-auto" />
                <p className="mt-1 text-lg font-bold">{contact._count.leads}</p>
                <p className="text-muted-foreground text-[10px]">Leads</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <Handshake size={16} className="text-muted-foreground mx-auto" />
                <p className="mt-1 text-lg font-bold">{contact._count.deals}</p>
                <p className="text-muted-foreground text-[10px]">Deals</p>
              </div>
            </div>
          </section>

          {contact.notes && (
            <>
              <Separator />
              <section className="space-y-2">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Notes
                </h4>
                <div className="bg-secondary rounded-lg p-3 text-sm">
                  <MessageCircle size={13} className="text-muted-foreground mb-1 inline" />{' '}
                  {contact.notes}
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </EntitySheet>
  );
}
