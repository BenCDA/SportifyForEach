import apiClient from './client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'COACH' | 'ADMIN';
  createdAt: string;
}

export interface AuthResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'CLIENT' | 'COACH';
  specialty?: string;
  bio?: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  me: () => apiClient.get<{ data: User }>('/auth/me'),
};
