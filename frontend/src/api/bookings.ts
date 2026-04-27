import apiClient from './client';
import { Session } from './sessions';

export interface Booking {
  id: string;
  sessionId: string;
  clientId: string;
  createdAt: string;
  session: Session;
}

export interface BookingsResponse {
  data: Booking[];
  meta: { page: number; limit: number; total: number };
}

export const bookingsApi = {
  create: (sessionId: string) =>
    apiClient.post<{ data: Booking }>('/bookings', { sessionId }),

  listMine: (params?: { page?: number; limit?: number }) =>
    apiClient.get<BookingsResponse>('/bookings/me', { params }),

  cancel: (id: string) => apiClient.delete(`/bookings/${id}`),
};
