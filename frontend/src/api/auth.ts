import apiClient from './client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'COACH' | 'ADMIN';
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  data: {
    user: User;
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'CLIENT' | 'COACH';
  specialties?: string[];
  bio?: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data, { _noRefresh: true } as object),

  logout: () =>
    apiClient.post('/auth/logout', undefined, { _noRefresh: true } as object),

  me: () => apiClient.get<{ data: User }>('/auth/me', { _noRefresh: true } as object),
};
