import axios from 'axios';
import { getSession } from 'next-auth/react';
import { toApiError } from './api-errors';

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

let _getToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  _getToken = getter;
}

async function resolveAuthToken(): Promise<string | null> {
  const configuredToken = await _getToken?.();
  if (configuredToken) return configuredToken;
  if (typeof window === 'undefined') return null;

  const session = await getSession();
  return session?.accessToken || null;
}

api.interceptors.request.use(async (config) => {
  const token = await resolveAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && 'data' in response.data && 'timestamp' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject(toApiError(error.response?.data, error.message));
    }
    return Promise.reject(error);
  },
);
