import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SlidersHorizontal, X, Calendar } from 'lucide-react';
import { sessionsApi, Session } from '../api/sessions';
import { bookingsApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import { SessionCard } from '../components/SessionCard';
import { SessionCardSkeleton } from '../components/Skeleton';
import { Pagination } from '../components/Pagination';
import axios from 'axios';

export function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ from: '', to: '' });

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await sessionsApi.list(params);
      setSessions(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Erreur lors du chargement des séances');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleBook = async (sessionId: string) => {
    setBookingId(sessionId);
    try {
      await bookingsApi.create(sessionId);
      toast.success('Réservation effectuée !');
      void fetchSessions();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error?.message as string ?? 'Erreur lors de la réservation');
      }
    } finally {
      setBookingId(null);
    }
  };

  const resetFilters = () => {
    setFilters({ from: '', to: '' });
    setPage(1);
  };

  const hasFilters = filters.from || filters.to;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Séances disponibles</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">{meta.total} séance{meta.total !== 1 ? 's' : ''} trouvée{meta.total !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-40 bg-[#0B0F19]/95 backdrop-blur-sm pb-4 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filtres</span>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-3 h-3" />Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-from" className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />À partir du
              </label>
              <input
                id="filter-from"
                type="datetime-local"
                className="input-field text-sm"
                value={filters.from}
                onChange={(e) => { setFilters(f => ({ ...f, from: e.target.value })); setPage(1); }}
              />
            </div>
            <div>
              <label htmlFor="filter-to" className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />Jusqu&apos;au
              </label>
              <input
                id="filter-to"
                type="datetime-local"
                className="input-field text-sm"
                value={filters.to}
                onChange={(e) => { setFilters(f => ({ ...f, to: e.target.value })); setPage(1); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SessionCardSkeleton key={i} />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="text-gray-300 font-medium mb-1">Aucune séance trouvée</h3>
          <p className="text-gray-600 text-sm">
            {hasFilters ? 'Essayez d\'ajuster vos filtres.' : 'Aucune séance n\'est disponible pour le moment.'}
          </p>
          {hasFilters && (
            <button onClick={resetFilters} className="btn-secondary text-sm mt-4">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onBook={user?.role === 'CLIENT' ? handleBook : undefined}
                booking={bookingId === session.id}
              />
            ))}
          </div>
          <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
