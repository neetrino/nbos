'use client';

import { useCallback, useEffect, useState } from 'react';
import { contactsApi, type Contact } from '@/lib/api/clients';
import { PORTFOLIO_DEEP_LINK } from '@/features/clients/constants/client-portfolio-deep-links';
import { projectsApi, type Project, type ProjectProductSummary } from '@/lib/api/projects';
import { supportApi } from '@/lib/api/support';
import { getApiErrorMessage } from '@/lib/api-errors';

type UseSupportCreateTicketFormParams = {
  projectsForFilters: Project[];
  loading: boolean;
  portfolioProjectIdFromUrl: string | null;
  portfolioCreateTicketFromUrl: boolean;
  refreshSupportViews: () => Promise<void>;
  setError: (message: string | null) => void;
};

export function useSupportCreateTicketForm({
  projectsForFilters,
  loading,
  portfolioProjectIdFromUrl,
  portfolioCreateTicketFromUrl,
  refreshSupportViews,
  setError,
}: UseSupportCreateTicketFormParams) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createProjectId, setCreateProjectId] = useState('');
  const [createProductId, setCreateProductId] = useState('');
  const [createCategory, setCreateCategory] = useState('UNCLASSIFIED');
  const [createPriority, setCreatePriority] = useState('P3');
  const [createDescription, setCreateDescription] = useState('');
  const [createCoverageDecision, setCreateCoverageDecision] = useState('');
  const [createContactId, setCreateContactId] = useState('');
  const [createProductOptions, setCreateProductOptions] = useState<ProjectProductSummary[]>([]);
  const [createContacts, setCreateContacts] = useState<Contact[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!createOpen) {
      return;
    }
    let cancelled = false;
    void contactsApi.getAll({ pageSize: 200 }).then((res) => {
      if (!cancelled) {
        setCreateContacts(res.items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [createOpen]);

  useEffect(() => {
    if (!createProjectId) {
      setCreateProductOptions([]);
      return;
    }
    let cancelled = false;
    void projectsApi.getById(createProjectId).then((project) => {
      if (!cancelled) {
        setCreateProductOptions(project.products ?? []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [createProjectId]);

  useEffect(() => {
    setCreateProductId('');
  }, [createProjectId]);

  useEffect(() => {
    if (!createOpen) {
      return;
    }
    const urlProject =
      portfolioCreateTicketFromUrl && portfolioProjectIdFromUrl ? portfolioProjectIdFromUrl : '';
    const projectOk =
      urlProject && projectsForFilters.some((p) => p.id === urlProject) ? urlProject : '';
    setCreateTitle('');
    setCreateProjectId(projectOk);
    setCreateProductId('');
    setCreateCategory('UNCLASSIFIED');
    setCreatePriority('P3');
    setCreateDescription('');
    setCreateCoverageDecision('');
    setCreateContactId('');
    setCreateProductOptions([]);
  }, [createOpen, portfolioCreateTicketFromUrl, portfolioProjectIdFromUrl, projectsForFilters]);

  useEffect(() => {
    if (!portfolioCreateTicketFromUrl || !portfolioProjectIdFromUrl || loading) {
      return;
    }
    if (!projectsForFilters.some((p) => p.id === portfolioProjectIdFromUrl)) {
      return;
    }
    setCreateOpen(true);
  }, [portfolioCreateTicketFromUrl, portfolioProjectIdFromUrl, loading, projectsForFilters]);

  const submitCreateTicket = useCallback(async () => {
    const title = createTitle.trim();
    if (!title || !createProjectId) {
      setError('Title and project are required to create a ticket.');
      return;
    }
    setActionId('create-ticket');
    try {
      await supportApi.create({
        title,
        projectId: createProjectId,
        category: createCategory,
        priority: createPriority,
        description: createDescription.trim() || undefined,
        productId: createProductId || undefined,
        coverageDecision: createCoverageDecision || undefined,
        contactId: createContactId || undefined,
      });
      setCreateOpen(false);
      setError(null);
      await refreshSupportViews();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Ticket could not be created.'));
    } finally {
      setActionId(null);
    }
  }, [
    createTitle,
    createProjectId,
    createCategory,
    createPriority,
    createDescription,
    createProductId,
    createCoverageDecision,
    createContactId,
    refreshSupportViews,
    setError,
  ]);

  return {
    createOpen,
    setCreateOpen,
    createTitle,
    setCreateTitle,
    createProjectId,
    setCreateProjectId,
    createProductId,
    setCreateProductId,
    createCategory,
    setCreateCategory,
    createPriority,
    setCreatePriority,
    createDescription,
    setCreateDescription,
    createCoverageDecision,
    setCreateCoverageDecision,
    createContactId,
    setCreateContactId,
    createProductOptions,
    createContacts,
    projectsForFilters,
    submitCreateTicket,
    createSubmitting: actionId === 'create-ticket',
  };
}
