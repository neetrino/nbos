import { api } from '../api';
import type { DashboardPersonalLink } from './dashboard';

export interface NavigationShellProjection {
  sidebarModuleOrder: string[];
  hiddenSidebarModules: string[];
  personalLinks: DashboardPersonalLink[];
}

export interface UpdateNavigationPreferencePayload {
  sidebarModuleOrder?: string[];
  hiddenSidebarModules?: string[];
}

export interface CreatePersonalLinkPayload {
  label: string;
  url: string;
  placement?: string[];
  openInNewTab?: boolean;
}

export const navigationApi = {
  async getShell(): Promise<NavigationShellProjection> {
    const response = await api.get<NavigationShellProjection>('/api/me/navigation');
    return response.data;
  },

  async updatePreferences(
    payload: UpdateNavigationPreferencePayload,
  ): Promise<NavigationShellProjection> {
    const response = await api.patch<NavigationShellProjection>('/api/me/navigation', payload);
    return response.data;
  },

  async createPersonalLink(payload: CreatePersonalLinkPayload): Promise<DashboardPersonalLink> {
    const response = await api.post<DashboardPersonalLink>('/api/me/personal-links', payload);
    return response.data;
  },

  async deletePersonalLink(id: string): Promise<void> {
    await api.delete(`/api/me/personal-links/${id}`);
  },
};
