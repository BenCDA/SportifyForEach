import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Clock, MapPin, User, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingsApi, Booking } from '../api/bookings';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '../components/Skeleton';
import { cn } from '../lib/utils';
import axios from 'axios';

function BookingCardSkeleton() {
  return (
    <div className="card">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/5" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.listMine({ page, limit: 10 });
      setBookings(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Annuler cette réservation ?')) return;
    setCancellingId(bookingId);
    try {
      await bookingsApi.cancel(bookingId);
      toast.success('Réservation annulée');
      void fetchBookings();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error?.message as string ?? 'Erreur lors de l\'annulation');
      }
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Mes réservations</h1>
        {loading ? null : (
          <p className="text-sm text-gray-500 mt-0.5">{meta.total} réservation{meta.total !== 1 ? 's' : ''}</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((k) => <BookingCardSkeleton key={k} />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="text-gray-300 font-medium mb-1">Aucune réservation</h3>
          <p className="text-gray-600 text-sm mb-4">Vous n&apos;avez pas encore réservé de séance.</p>
          <Link to="/sessions" className="inline-flex items-center gap-1.5 btn-primary text-sm">
            Voir les séances <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {bookings.map((booking) => {
              const startDate = new Date(booking.session.startAt);
              const isPast = startDate < now;
              return (
                <div
                  key={booking.id}
                  className={cn(
                    'bg-gray-900 rounded-xl border p-5 transition-all duration-200',
                    isPast ? 'border-gray-800/50 opacity-60' : 'border-gray-800 hover:border-gray-700',
                  )}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-100 truncate">{booking.session.title}</h3>
                        {isPast ? (
                          <span className="shrink-0 text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full border border-gray-700">Passée</span>
                        ) : (
                          <span className="shrink-0 text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">À venir</span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span>
                            {startDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {' à '}
                            {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {booking.session.durationMin} min
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span>{booking.session.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                          <span>{booking.session.coach.firstName} {booking.session.coach.lastName}</span>
                        </div>
                      </div>
                    </div>
                    {!isPast && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="btn-danger text-sm shrink-0"
                      >
                        {cancellingId === booking.id ? '...' : 'Annuler'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
