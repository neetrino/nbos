'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Phone, Mail, Building2, RefreshCcw, Users } from 'lucide-react';
import { contactsApi, type Contact } from '@/lib/api/clients';

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  PARTNER: 'Partner',
  CONTRACTOR: 'Contractor',
  OTHER: 'Other',
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contactsApi.getAll({
        pageSize: 50,
        search: search || undefined,
      });
      setContacts(data.items);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Contacts</h1>
          <p className="text-muted-foreground mt-1 text-sm">{contacts.length} contacts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchContacts}
            className="border-border text-muted-foreground hover:bg-secondary rounded-xl border p-2.5 transition-colors"
          >
            <RefreshCcw size={16} />
          </button>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
            <Plus size={16} />
            New Contact
          </button>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts by name, email, phone..."
          className="border-input bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-accent h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed py-20 text-center">
          <Users size={48} className="text-muted-foreground/30 mx-auto" />
          <h3 className="text-foreground mt-4 text-lg font-semibold">No contacts yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Add your first contact to get started
          </p>
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Name
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Contact
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Role
                </th>
                <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium">
                  Companies
                </th>
                <th className="text-muted-foreground px-4 py-3 text-center text-xs font-medium">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-foreground text-sm font-medium">
                      {contact.firstName} {contact.lastName}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {contact.phone && (
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Phone size={11} />
                          {contact.phone}
                        </div>
                      )}
                      {contact.email && (
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Mail size={11} />
                          {contact.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-secondary text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
                      {ROLE_LABELS[contact.role] ?? contact.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {contact.companies.length > 0 ? (
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <Building2 size={12} />
                        {contact.companies.map((c) => c.name).join(', ')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-center text-xs">
                    {contact._count.projects}P / {contact._count.leads}L / {contact._count.deals}D
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
