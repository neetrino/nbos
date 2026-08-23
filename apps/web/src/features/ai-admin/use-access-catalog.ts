import { useQuery } from '@tanstack/react-query';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { tasksApi } from '@/lib/api/tasks';
import { AI_ADMIN_WORKSPACE_PICKER_PAGE_SIZE } from './constants';

export function useAccessCatalog() {
  const capabilities = useQuery({
    queryKey: ['ai-admin', 'capabilities'],
    queryFn: () => aiAdminApi.capabilities(),
  });
  const workspaces = useQuery({
    queryKey: ['ai-admin', 'workspaces'],
    queryFn: async () => {
      const result = await tasksApi.getWorkSpaces({
        pageSize: AI_ADMIN_WORKSPACE_PICKER_PAGE_SIZE,
      });
      return result.items;
    },
  });
  const error =
    (capabilities.isError ? 'Capability catalog could not be loaded.' : null) ??
    (workspaces.isError ? 'Work Spaces could not be loaded.' : null);
  return {
    catalog: capabilities.data ?? [],
    workspaces: workspaces.data ?? [],
    loading: capabilities.isLoading || workspaces.isLoading,
    error,
    retry: () => {
      void capabilities.refetch();
      void workspaces.refetch();
    },
    ready: capabilities.isSuccess && workspaces.isSuccess,
  };
}
