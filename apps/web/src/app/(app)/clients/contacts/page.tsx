'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCcw, Users, Phone, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PageHeader, FilterBar, EmptyState, StatusBadge } from '@/components/shared';
import { ContactSheet } from '@/features/clients/components/ContactSheet';
import { CreateContactDialog } from '@/features/clients/components/CreateContactDialog';
import {
  CONTACT_ROLES,
  CONTACT_SOURCES,
  getContactRole,
} from '@/features/clients/constants/clients';
import { contactsApi, type Contact } from '@/lib/api/clients';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contactsApi.getAll({
        pageSize: 100,
        search: search || undefined,
        role: filters.role && filters.role !== 'all' ? filters.role : undefined,
      });
      setContacts(data.items);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    await contactsApi.create(data);
    await fetchContacts();
  };

  const handleDelete = async (id: string) => {
    await contactsApi.delete(id);
    setSheetOpen(false);
    setSelectedContact(null);
    await fetchContacts();
  };

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
    setSheetOpen(true);
  };

  const filterConfigs = [
    {
      key: 'role',
      label: 'Role',
      options: CONTACT_ROLES.map((r) => ({ value: r.value, label: r.label })),
    },
    {
      key: 'source',
      label: 'Source',
      options: CONTACT_SOURCES.map((s) => ({ value: s.value, label: s.label })),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Contacts" description={`${contacts.length} contacts`}>
        <Button variant="outline" size="icon" onClick={fetchContacts}>
          <RefreshCcw size={16} />
        </Button>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New Contact
        </Button>
      </PageHeader>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, phone..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to get started"
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Create First Contact
            </Button>
          }
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Companies</TableHead>
                <TableHead className="text-center">Projects</TableHead>
                <TableHead className="text-center">Leads</TableHead>
                <TableHead className="text-center">Deals</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => {
                const role = getContactRole(contact.role);
                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(contact)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-accent/20 text-accent flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
                          {contact.firstName[0]}
                          {contact.lastName[0]}
                        </div>
                        <span className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {contact.phone && (
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Phone size={10} />
                            {contact.phone}
                          </div>
                        )}
                        {contact.email && (
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Mail size={10} />
                            {contact.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {role && <StatusBadge label={role.label} variant={role.variant} />}
                    </TableCell>
                    <TableCell>
                      {contact.companies.length > 0 ? (
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Building2 size={11} />
                          <span className="max-w-[150px] truncate">
                            {contact.companies.map((c) => c.name).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {contact._count.projects}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      {contact._count.leads}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      {contact._count.deals}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateContactDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={fetchContacts}
      />

      <ContactSheet
        contact={selectedContact}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
