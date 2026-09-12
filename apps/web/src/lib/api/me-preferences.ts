import type { InterfaceLocalePreference, WritableInterfaceLocale } from '@nbos/shared';
import { api } from '../api';

export type { InterfaceLocalePreference };

export async function getMyInterfaceLocale(): Promise<InterfaceLocalePreference> {
  const response = await api.get<InterfaceLocalePreference>('/api/v1/me/preferences');
  return response.data;
}

export async function patchMyInterfaceLocale(
  interfaceLocale: WritableInterfaceLocale,
): Promise<InterfaceLocalePreference> {
  const response = await api.patch<InterfaceLocalePreference>('/api/v1/me/preferences', {
    interfaceLocale,
  });
  return response.data;
}
