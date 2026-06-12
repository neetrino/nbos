'use client';

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NAVIGABLE_ENTITY_CARD_GRID_CLASS,
  useModuleHeroSlots,
  IntegratedSearchFilters,
  ViewModeSwitch,
  EmptyState,
  ErrorState,
  LoadingState,
  DeleteConfirmDialog,
  ProfileAPermanentDeleteDialog,
  useDeleteConfirm,
} from '@/components/shared';
import { ContactCard } from '@/features/clients/components/ContactCard';
import { ContactSheet } from '@/features/clients/components/ContactSheet';
import { ContactsTable } from '@/features/clients/components/ContactsTable';
import { CreateContactDialog } from '@/features/clients/components/CreateContactDialog';
import {
  CLIENTS_DIRECTORY_VIEW_OPTIONS,
  type ClientsDirectoryViewMode,
} from '@/features/clients/constants/clients-directory-view-options';
import { CONTACT_ROLES } from '@/features/clients/constants/clients';
import { ClientsDirectorySettingsSheet } from '@/features/clients/components/clients-directory-settings-sheet';
import { ClientsDirectoryTrashBanner } from '@/features/clients/components/clients-directory-trash-banner';
import { useListScope } from '@/hooks/use-list-scope';
import { contactsApi, type Contact } from '@/lib/api/clients';
import { toast } from 'sonner';

const OPEN_CONTACT_QUERY = 'openId';

function ContactsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<ClientsDirectoryViewMode>('grid');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const deleteConfirm = useDeleteConfirm();
  const permanentDeleteConfirm = useDeleteConfirm();
  const [purging, setPurging] = useState(false);

  function contactDisplayName(contact: Contact): string {
    return `${contact.firstName} ${contact.lastName}`.trim() || 'Contact';
  }

  const stripOpenContactFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(OPEN_CONTACT_QUERY)) return;
    params.delete(OPEN_CONTACT_QUERY);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const { scope, setScope, isTrashView } = useListScope({
    onScopeChange: () => {
      setSheetOpen(false);
      setSelectedContact(null);
      stripOpenContactFromUrl();
    },
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contactsApi.getAll({
        pageSize: 100,
        scope,
        search: search || undefined,
        contactType:
          filters.contactType && filters.contactType !== 'all' ? filters.contactType : undefined,
      });
      setContacts(data.items);
      setError(null);
    } catch {
      setError('Contacts could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters, scope]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openContactId = searchParams.get(OPEN_CONTACT_QUERY);
  const deepLinkContactAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    deepLinkContactAttemptedRef.current = null;
  }, [openContactId]);

  const pushOpenContactToUrl = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_CONTACT_QUERY, id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!openContactId || loading) return;
    const match = contacts.find((c) => c.id === openContactId);
    if (match) {
      setSelectedContact(match);
      setSheetOpen(true);
      return;
    }
    if (deepLinkContactAttemptedRef.current === openContactId) return;
    deepLinkContactAttemptedRef.current = openContactId;
    let cancelled = false;
    void (async () => {
      try {
        const contact = await contactsApi.getById(openContactId);
        if (cancelled) return;
        setContacts((prev) => (prev.some((c) => c.id === contact.id) ? prev : [contact, ...prev]));
        setSelectedContact(contact);
        setSheetOpen(true);
      } catch {
        if (!cancelled) {
          toast.error('Contact not found or you cannot open it.');
          stripOpenContactFromUrl();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openContactId, loading, contacts, stripOpenContactFromUrl]);

  const handleUpdate = async (id: string, data: Record<string, unknown>) => {
    const updated = await contactsApi.update(id, data);
    setSelectedContact(updated);
    await fetchContacts();
  };

  const handleMoveToTrash = async (id: string) => {
    await contactsApi.moveToTrash(id);
    toast.success('Contact moved to Trash');
    setSheetOpen(false);
    setSelectedContact(null);
    stripOpenContactFromUrl();
    await fetchContacts();
  };

  const handleRestore = async (id: string) => {
    const restored = await contactsApi.restore(id);
    toast.success('Contact restored');
    setSelectedContact(restored);
    await fetchContacts();
  };

  const runPermanentDelete = async () => {
    const id = permanentDeleteConfirm.target?.id;
    if (!id) return;
    setPurging(true);
    try {
      await contactsApi.permanentDelete(id);
      toast.success('Contact permanently deleted');
      permanentDeleteConfirm.clear();
      setSheetOpen(false);
      setSelectedContact(null);
      stripOpenContactFromUrl();
      await fetchContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete contact');
    } finally {
      setPurging(false);
    }
  };

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
    setSheetOpen(true);
    pushOpenContactToUrl(contact.id);
  };

  const filterConfigs = useMemo(
    () => [
      {
        key: 'contactType',
        label: 'Contact Type',
        options: CONTACT_ROLES.map((r) => ({ value: r.value, label: r.label })),
      },
    ],
    [],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email, phone…"
          filters={filterConfigs}
          filterValues={filters}
          onFilterChange={(key: string, value: string) =>
            setFilters((prev) => ({ ...prev, [key]: value }))
          }
          onClearAll={() => setFilters({})}
        />
      ),
      viewMode: (
        <ViewModeSwitch value={view} onChange={setView} options={CLIENTS_DIRECTORY_VIEW_OPTIONS} />
      ),
      trailing: (
        <div className="flex items-center gap-2">
          <ClientsDirectorySettingsSheet
            listScope={scope}
            onListScopeChange={setScope}
            entityLabel="contacts"
          />
          {!isTrashView ? (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} aria-hidden />
              New Contact
            </Button>
          ) : null}
        </div>
      ),
    }),
    [filterConfigs, filters, isTrashView, scope, search, setScope, view],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full flex-col gap-5">
      {isTrashView ? (
        <ClientsDirectoryTrashBanner
          entityLabel="contacts"
          onBackToActive={() => setScope('active')}
        />
      ) : null}
      {loading ? (
        <LoadingState
          variant={view === 'grid' ? 'cards' : 'list'}
          count={view === 'grid' ? 6 : 5}
        />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchContacts} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title={isTrashView ? 'Trash is empty' : 'No contacts yet'}
          description={
            isTrashView
              ? 'Removed contacts will appear here until restored or purged.'
              : 'Add your first contact to get started'
          }
          action={
            isTrashView ? undefined : (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} />
                Create First Contact
              </Button>
            )
          }
        />
      ) : view === 'grid' ? (
        <div className={NAVIGABLE_ENTITY_CARD_GRID_CLASS}>
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} onOpen={handleRowClick} />
          ))}
        </div>
      ) : (
        <ContactsTable contacts={contacts} onOpen={handleRowClick} />
      )}

      <CreateContactDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={fetchContacts}
      />

      <ContactSheet
        contact={selectedContact}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setSelectedContact(null);
            stripOpenContactFromUrl();
          }
        }}
        onUpdate={handleUpdate}
        isTrashView={isTrashView}
        onMoveToTrash={
          isTrashView
            ? undefined
            : (id) => {
                const contact =
                  selectedContact?.id === id
                    ? selectedContact
                    : contacts.find((item) => item.id === id);
                if (!contact) return;
                deleteConfirm.request({ id, name: contactDisplayName(contact) });
              }
        }
        onRestore={isTrashView ? (id) => void handleRestore(id) : undefined}
        onPermanentDelete={
          isTrashView
            ? (id) => {
                const contact =
                  selectedContact?.id === id
                    ? selectedContact
                    : contacts.find((item) => item.id === id);
                if (!contact) return;
                permanentDeleteConfirm.request({ id, name: contactDisplayName(contact) });
              }
            : undefined
        }
      />

      <DeleteConfirmDialog
        level="simple"
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        itemName={deleteConfirm.target?.name ?? ''}
        title="Move contact to Trash?"
        description="The contact will be removed from active lists. You can restore it from Trash later."
        onConfirm={() => {
          const id = deleteConfirm.target?.id;
          if (!id) return;
          deleteConfirm.clear();
          void handleMoveToTrash(id);
        }}
      />

      <ProfileAPermanentDeleteDialog
        open={permanentDeleteConfirm.open}
        onOpenChange={permanentDeleteConfirm.onOpenChange}
        itemName={permanentDeleteConfirm.target?.name ?? ''}
        entityLabel="contact"
        isSubmitting={purging}
        onConfirm={() => void runPermanentDelete()}
      />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ContactsPageContent />
    </Suspense>
  );
}
