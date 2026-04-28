import apiClient from './client';

export const sportsApi = {
  list: () => apiClient.get<{ data: string[] }>('/sports'),
};
