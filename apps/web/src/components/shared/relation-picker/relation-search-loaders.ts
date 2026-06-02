'use client';

import { useCallback } from 'react';
import { contactsApi, companiesApi } from '@/lib/api/clients';
import { projectsApi } from '@/lib/api/projects';
import { productsApi } from '@/lib/api/products';
import { searchEmployeesForPicker } from '@/lib/employees';
import type { RelationPickerSearchFn } from './relation-picker.types';

const DEFAULT_PAGE_SIZE = 8;

/** Search contacts for {@link RelationPickerField}. */
export function useContactRelationSearch(pageSize = DEFAULT_PAGE_SIZE): RelationPickerSearchFn {
  return useCallback(
    async (query: string) => {
      const res = await contactsApi.getAll({
        pageSize,
        search: query.trim() || undefined,
      });
      return res.items.map((contact) => ({
        value: contact.id,
        label: `${contact.firstName} ${contact.lastName}`.trim(),
        subtitle: [contact.phone, contact.email].filter(Boolean).join(' · ') || undefined,
      }));
    },
    [pageSize],
  );
}

/** Search companies for {@link RelationPickerField}. */
export function useCompanyRelationSearch(pageSize = DEFAULT_PAGE_SIZE): RelationPickerSearchFn {
  return useCallback(
    async (query: string) => {
      const res = await companiesApi.getAll({
        pageSize,
        search: query.trim() || undefined,
      });
      return res.items.map((company) => ({
        value: company.id,
        label: company.name,
        subtitle: company.type,
      }));
    },
    [pageSize],
  );
}

/** Search projects for {@link RelationPickerField}. */
export function useProjectRelationSearch(pageSize = DEFAULT_PAGE_SIZE): RelationPickerSearchFn {
  return useCallback(
    async (query: string) => {
      const res = await projectsApi.getAll({
        pageSize,
        search: query.trim() || undefined,
      });
      return res.items.map((project) => ({
        value: project.id,
        label: project.name,
        subtitle: project.code,
      }));
    },
    [pageSize],
  );
}

/** Empty query: cached page 1 (20). Typed query: API search (20). */
export function useEmployeeRelationSearch(
  excludeIds?: ReadonlySet<string>,
): RelationPickerSearchFn {
  return useCallback(
    async (query: string) => searchEmployeesForPicker(query, excludeIds),
    [excludeIds],
  );
}

/** Search products (optionally scoped to a project) for {@link RelationPickerField}. */
export function useProductRelationSearch(
  projectId: string | null,
  pageSize = DEFAULT_PAGE_SIZE,
): RelationPickerSearchFn {
  return useCallback(
    async (query: string) => {
      if (projectId) {
        const project = await projectsApi.getById(projectId);
        const needle = query.trim().toLowerCase();
        return (project.products ?? [])
          .filter((product) => !needle || product.name.toLowerCase().includes(needle))
          .slice(0, pageSize)
          .map((product) => ({
            value: product.id,
            label: product.name,
          }));
      }
      const res = await productsApi.getAll({
        pageSize,
        search: query.trim() || undefined,
      });
      return res.items.map((product) => ({
        value: product.id,
        label: product.name,
        subtitle: product.productType,
      }));
    },
    [projectId, pageSize],
  );
}
