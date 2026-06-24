'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ContactSheet } from '@/features/clients/components/ContactSheet';
import { CreateContactDialog } from '@/features/clients/components/CreateContactDialog';

const CompanySheet = dynamic(() =>
  import('@/features/clients/components/CompanySheet').then((mod) => ({
    default: mod.CompanySheet,
  })),
);

const CreateCompanyDialog = dynamic(() =>
  import('@/features/clients/components/CreateCompanyDialog').then((mod) => ({
    default: mod.CreateCompanyDialog,
  })),
);
import { CreateProjectHubDialog } from '@/features/projects/components/CreateProjectHubDialog';
import { CreatePartnerDialog } from '@/features/partners/components/CreatePartnerDialog';
import { CreateProductDialog } from '@/features/projects/components/CreateProductDialog';
import { PartnerDetailSheet } from '@/features/partners/components/PartnerDetailSheet';
import { contactsApi, companiesApi, type Contact, type Company } from '@/lib/api/clients';
import { employeesApi, type Employee } from '@/lib/api/employees';
import { EmployeeSheet } from '@/features/hr/components/EmployeeSheet';
import type { Project } from '@/lib/api/projects';
import { productsApi, type Product } from '@/lib/api/products';
import { getApiErrorMessage } from '@/lib/api-errors';
import { parseRelationCreateIntent } from './parse-relation-create-intent';
import { emitRelationCreatedHandlers } from './relation-created-registry';
import { EntityRelationsProvider, type EntityRelationsApi } from './entity-relations-context';
import { buildRelationCreatePrefill } from './build-relation-create-prefill';
import type {
  RelationCreateContext,
  RelationCreatePrefill,
  RelationEntityKind,
} from './relation-picker.types';
import type { RelationCreatedEvent } from './relation-created-event';

type CreateKind = 'contact' | 'company' | 'project' | 'partner' | 'product';

function relationCreateFieldIntent(intent?: string): string | undefined {
  return parseRelationCreateIntent(intent).fieldIntent;
}

type EntityRelationHostProps = {
  children: ReactNode;
  onEntityChanged?: () => void;
  onRelationCreated?: (event: RelationCreatedEvent) => void;
  /** Child entity sheets stack above an open parent sheet rail (default). */
  nested?: boolean;
};

export function EntityRelationHost({
  children,
  onEntityChanged,
  onRelationCreated,
  nested = true,
}: EntityRelationHostProps) {
  const router = useRouter();
  const [contactOpenId, setContactOpenId] = useState<string | null>(null);
  const [contactSheet, setContactSheet] = useState<Contact | null>(null);
  const [companyOpenId, setCompanyOpenId] = useState<string | null>(null);
  const [companySheet, setCompanySheet] = useState<Company | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [employeeOpenId, setEmployeeOpenId] = useState<string | null>(null);
  const [employeeSheet, setEmployeeSheet] = useState<Employee | null>(null);
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [createPrefill, setCreatePrefill] = useState<RelationCreatePrefill | null>(null);
  const [createIntent, setCreateIntent] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!contactOpenId) return;
    if (contactSheet?.id === contactOpenId) return;
    let cancelled = false;
    void contactsApi
      .getById(contactOpenId)
      .then((contact) => {
        if (!cancelled) setContactSheet(contact);
      })
      .catch((caught) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(caught, 'Contact could not be opened.'));
          setContactOpenId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [contactOpenId, contactSheet?.id]);

  useEffect(() => {
    if (!companyOpenId) return;
    if (companySheet?.id === companyOpenId) return;
    let cancelled = false;
    void companiesApi
      .getById(companyOpenId)
      .then((company) => {
        if (!cancelled) setCompanySheet(company);
      })
      .catch((caught) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(caught, 'Company could not be opened.'));
          setCompanyOpenId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [companyOpenId, companySheet?.id]);

  useEffect(() => {
    if (!employeeOpenId) return;
    if (employeeSheet?.id === employeeOpenId) return;
    let cancelled = false;
    void employeesApi
      .getById(employeeOpenId)
      .then((employee) => {
        if (!cancelled) setEmployeeSheet(employee);
      })
      .catch((caught) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(caught, 'Employee could not be opened.'));
          setEmployeeOpenId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [employeeOpenId, employeeSheet?.id]);

  const openEntity = useCallback(
    (kind: RelationEntityKind, id: string) => {
      if (kind === 'project') {
        router.push(`/projects/${id}`);
        return;
      }
      if (kind === 'contact') {
        setContactOpenId(id);
        setContactSheet((current) => (current?.id === id ? current : null));
        return;
      }
      if (kind === 'company') {
        setCompanyOpenId(id);
        setCompanySheet((current) => (current?.id === id ? current : null));
        return;
      }
      if (kind === 'partner') {
        setPartnerId(id);
        return;
      }
      if (kind === 'employee') {
        setEmployeeOpenId(id);
        setEmployeeSheet((current) => (current?.id === id ? current : null));
        return;
      }
      if (kind === 'product') {
        void productsApi
          .getById(id)
          .then((product) => {
            router.push(`/projects/${product.projectId}/products/${id}`);
          })
          .catch((caught) => {
            toast.error(getApiErrorMessage(caught, 'Product could not be opened.'));
          });
      }
    },
    [router],
  );

  const openCreate = useCallback(
    (
      kind: RelationEntityKind,
      searchQuery = '',
      intent?: string,
      context?: RelationCreateContext,
    ) => {
      if (kind === 'employee') return;
      if (kind === 'product') {
        const prefill = buildRelationCreatePrefill(kind, searchQuery, context, intent);
        if (!prefill.projectId) return;
        setCreatePrefill(prefill);
        setCreateIntent(intent);
        setCreateKind('product');
        return;
      }
      setCreatePrefill(buildRelationCreatePrefill(kind, searchQuery, context, intent));
      setCreateIntent(intent);
      setCreateKind(kind);
    },
    [],
  );

  const api = useMemo<EntityRelationsApi>(
    () => ({
      openEntity,
      openCreate,
      buildCreatePrefill: buildRelationCreatePrefill,
    }),
    [openEntity, openCreate],
  );

  const closeCreate = () => {
    setCreateKind(null);
    setCreatePrefill(null);
    setCreateIntent(undefined);
  };

  const emitCreated = (event: RelationCreatedEvent) => {
    onRelationCreated?.(event);
    emitRelationCreatedHandlers(event);
    onEntityChanged?.();
  };

  const handleContactCreated = (contact?: Contact) => {
    const intent = createIntent;
    closeCreate();
    if (contact) {
      const label = `${contact.firstName} ${contact.lastName}`.trim();
      setContactOpenId(contact.id);
      setContactSheet(contact);
      emitCreated({
        kind: 'contact',
        id: contact.id,
        label,
        intent: relationCreateFieldIntent(intent),
      });
    }
  };

  const handleCompanyCreated = (company?: Company) => {
    const intent = createIntent;
    closeCreate();
    if (company) {
      setCompanyOpenId(company.id);
      setCompanySheet(company);
      emitCreated({
        kind: 'company',
        id: company.id,
        label: company.name,
        intent: relationCreateFieldIntent(intent),
      });
    }
  };

  const handleProjectCreated = (project: Project) => {
    const intent = createIntent;
    closeCreate();
    emitCreated({
      kind: 'project',
      id: project.id,
      label: project.name,
      intent: relationCreateFieldIntent(intent),
    });
  };

  const handlePartnerCreated = (partner?: { id: string; name: string }) => {
    const intent = createIntent;
    closeCreate();
    if (partner) {
      setPartnerId(partner.id);
      emitCreated({
        kind: 'partner',
        id: partner.id,
        label: partner.name,
        intent: relationCreateFieldIntent(intent),
      });
    }
  };

  const handleProductCreated = (product?: Product) => {
    const intent = createIntent;
    closeCreate();
    if (product) {
      emitCreated({
        kind: 'product',
        id: product.id,
        label: product.name,
        intent: relationCreateFieldIntent(intent),
      });
    }
  };

  return (
    <EntityRelationsProvider value={api}>
      {children}

      <ContactSheet
        contact={contactSheet}
        open={contactOpenId !== null}
        forceNestedBackdrop={nested}
        onOpenChange={(next) => {
          if (!next) {
            setContactOpenId(null);
            setContactSheet(null);
          }
        }}
        onUpdate={async (id, data) => {
          const updated = await contactsApi.update(id, data);
          setContactSheet(updated);
          onEntityChanged?.();
        }}
      />

      <CompanySheet
        company={companySheet}
        open={companyOpenId !== null}
        forceNestedBackdrop={nested}
        onOpenChange={(next) => {
          if (!next) {
            setCompanyOpenId(null);
            setCompanySheet(null);
          }
        }}
        onUpdate={async (id, data) => {
          const updated = await companiesApi.update(id, data);
          setCompanySheet(updated);
          onEntityChanged?.();
        }}
      />

      <PartnerDetailSheet
        partnerId={partnerId}
        open={Boolean(partnerId)}
        forceNestedBackdrop={nested}
        onOpenChange={(next) => {
          if (!next) setPartnerId(null);
        }}
        onPartnerUpdated={() => onEntityChanged?.()}
      />

      <EmployeeSheet
        employee={employeeSheet}
        open={employeeOpenId !== null}
        forceNestedBackdrop={nested}
        onOpenChange={(next) => {
          if (!next) {
            setEmployeeOpenId(null);
            setEmployeeSheet(null);
          }
        }}
      />

      <CreateContactDialog
        open={createKind === 'contact'}
        prefill={createPrefill}
        onOpenChange={(next) => {
          if (!next) closeCreate();
        }}
        onCreated={handleContactCreated}
      />

      <CreateCompanyDialog
        open={createKind === 'company'}
        defaultName={createPrefill?.name}
        onOpenChange={(next) => {
          if (!next) closeCreate();
        }}
        onCreated={handleCompanyCreated}
      />

      <CreateProjectHubDialog
        open={createKind === 'project'}
        defaultName={createPrefill?.name}
        onOpenChange={(next) => {
          if (!next) closeCreate();
        }}
        onCreated={handleProjectCreated}
      />

      <CreatePartnerDialog
        open={createKind === 'partner'}
        defaultName={createPrefill?.name}
        onOpenChange={(next) => {
          if (!next) closeCreate();
        }}
        onCreated={handlePartnerCreated}
      />

      {createPrefill?.projectId ? (
        <CreateProductDialog
          open={createKind === 'product'}
          projectId={createPrefill.projectId}
          defaultName={createPrefill.name}
          onOpenChange={(next) => {
            if (!next) closeCreate();
          }}
          onCreated={handleProductCreated}
        />
      ) : null}
    </EntityRelationsProvider>
  );
}
