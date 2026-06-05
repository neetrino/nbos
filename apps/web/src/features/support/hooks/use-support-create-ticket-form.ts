'use client';

import { useCallback, useEffect, useState } from 'react';
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
  defaultCategory?: string;
};

export function useSupportCreateTicketForm({
  projectsForFilters,
  loading,
  portfolioProjectIdFromUrl,
  portfolioCreateTicketFromUrl,
  refreshSupportViews,
  setError,
  defaultCategory = 'UNCLASSIFIED',
}: UseSupportCreateTicketFormParams) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createProjectId, setCreateProjectId] = useState('');
  const [createProductId, setCreateProductId] = useState('');
  const [createCategory, setCreateCategory] = useState('UNCLASSIFIED');
  const [createPriority, setCreatePriority] = useState('P3');
  const [createDescription, setCreateDescription] = useState('');
  const [createProductOptions, setCreateProductOptions] = useState<ProjectProductSummary[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

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
    setCreateCategory(defaultCategory);
    setCreatePriority('P3');
    setCreateDescription('');
    setCreateProductOptions([]);
  }, [
    createOpen,
    portfolioCreateTicketFromUrl,
    portfolioProjectIdFromUrl,
    projectsForFilters,
    defaultCategory,
  ]);

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
    if (!title) {
      setError('Title is required to create a ticket.');
      return;
    }
    setActionId('create-ticket');
    try {
      await supportApi.create({
        title,
        projectId: createProjectId || undefined,
        category: createCategory,
        priority: createPriority,
        description: createDescription.trim() || undefined,
        productId: createProductId || undefined,
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
    createProductOptions,
    projectsForFilters,
    submitCreateTicket,
    createSubmitting: actionId === 'create-ticket',
  };
}
