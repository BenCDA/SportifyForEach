import apiClient from './client';
import { User } from './auth';

export interface UsersResponse {
  data: User[];
  meta: { page: number; limit: number; total: number };
}

export const usersApi = {
  list: (params?: { page?: number; limit?: number; role?: string }) =>
    apiClient.get<UsersResponse>('/users', { params }),

  update: (id: string, data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'role'>>) =>
    apiClient.put<{ data: User }>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete(`/users/${id}`),
};
