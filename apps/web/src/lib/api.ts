import axios from 'axios';
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

api.interceptors.request.use(async (config) => {
  if (_getToken) {
    const token = await _getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
