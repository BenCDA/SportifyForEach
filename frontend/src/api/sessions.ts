import apiClient from './client';

export interface Session {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  durationMin: number;
  capacity: number;
  location: string;
  createdAt: string;
  coach: { id: string; firstName: string; lastName: string; email: string };
  bookingsCount: number;
  participants?: { id: string; firstName: string; lastName: string; email: string }[];
}

export interface SessionsResponse {
  data: Session[];
  meta: { page: number; limit: number; total: number };
}

export interface SessionFilters {
  from?: string;
  to?: string;
  coachId?: string;
  page?: number;
  limit?: number;
}

export interface CreateSessionInput {
  title: string;
  description?: string;
  startAt: string;
  durationMin: number;
  capacity: number;
  location: string;
}

export const sessionsApi = {
  list: (filters?: SessionFilters) =>
    apiClient.get<SessionsResponse>('/sessions', { params: filters }),

  get: (id: string) => apiClient.get<{ data: Session }>(`/sessions/${id}`),

  create: (data: CreateSessionInput) =>
    apiClient.post<{ data: Session }>('/sessions', data),

  update: (id: string, data: Partial<CreateSessionInput>) =>
    apiClient.put<{ data: Session }>(`/sessions/${id}`, data),

  delete: (id: string) => apiClient.delete(`/sessions/${id}`),
};
