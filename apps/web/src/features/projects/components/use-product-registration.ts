'use client';

import { useEffect, useRef, useState } from 'react';
import { projectsApi } from '@/lib/api/projects';
import type { RegistrationRelation } from './ProductRegistrationRelation';

const EMPTY_RELATION: RegistrationRelation = { mode: 'none', id: '', label: '' };

/** Project defaults never overwrite an explicit contact/company choice or a newer search. */
export function useProductRegistration(projectId?: string) {
  const [project, setProject] = useState<RegistrationRelation>(
    projectId
      ? { mode: 'existing', id: projectId, label: projectId }
      : { mode: 'create', id: '', label: '' },
  );
  const [company, setCompany] = useState<RegistrationRelation>(EMPTY_RELATION);
  const [contact, setContact] = useState({ id: '', label: '' });
  const [resolvedProjectId, setResolvedProjectId] = useState('');
  const [failedProjectId, setFailedProjectId] = useState('');
  const companyChosen = useRef(false);
  const contactChosen = useRef(false);

  useEffect(() => {
    if (project.mode !== 'existing') return;
    let current = true;
    void projectsApi
      .getById(project.id)
      .then((record) => {
        if (!current) return;
        setFailedProjectId('');
        setProject((prev) => ({ ...prev, label: record.name }));
        if (!contactChosen.current && record.contact) {
          setContact({
            id: record.contact.id,
            label: `${record.contact.firstName} ${record.contact.lastName}`.trim(),
          });
        }
        if (!companyChosen.current) {
          setCompany(
            record.company
              ? { mode: 'existing', id: record.company.id, label: record.company.name }
              : EMPTY_RELATION,
          );
        }
      })
      .catch(() => {
        if (current) setFailedProjectId(project.id);
      })
      .finally(() => {
        if (current) setResolvedProjectId(project.id);
      });
    return () => {
      current = false;
    };
  }, [project.id, project.mode]);

  return {
    project,
    setProject: (next: RegistrationRelation) => {
      if (next.id !== project.id || next.mode !== project.mode) {
        setResolvedProjectId('');
        setFailedProjectId('');
      }
      setProject(next);
    },
    company,
    contact,
    resolving: project.mode === 'existing' && resolvedProjectId !== project.id,
    contextError: project.mode === 'existing' && failedProjectId === project.id,
    selectCompany: (next: RegistrationRelation) => {
      companyChosen.current = true;
      setCompany(next);
    },
    selectContact: (id: string, label: string) => {
      contactChosen.current = true;
      setContact({ id, label });
    },
  };
}
