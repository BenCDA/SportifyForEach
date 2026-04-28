import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingsApi, Booking } from '../api/bookings';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '../components/Skeleton';
import { formatSessionDate, cn } from '../lib/utils';
import axios from 'axios';

function BookingRowSkeleton() {
  return (
    <div className="border-b border-ink/8 px-4 py-5">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-9 w-20 shrink-0" />
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

  useEffect(() => { void fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Annuler cette réservation ?')) return;
    setCancellingId(bookingId);
    try {
      await bookingsApi.cancel(bookingId);
      toast.success('Réservation annulée');
      void fetchBookings();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          (err.response?.data as { error?: { message?: string } })?.error?.message ??
            "Erreur lors de l'annulation",
        );
      }
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();
  const plural = meta.total === 1 ? '' : 's';

  return (
    <div>
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-ink/8">
        <h1 className="font-serif italic text-[clamp(32px,4vw,48px)] text-ink leading-tight tracking-tight">
          Réservations
        </h1>
        {!loading && (
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-1">
            {meta.total} réservation{plural}
          </p>
        )}
      </div>

      {loading ? (
        <div>
          {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((k) => <BookingRowSkeleton key={k} />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif italic text-3xl text-ink/30 mb-3">Rien ici. Pour l&apos;instant.</p>
          <p className="font-sans text-sm text-muted mb-6">Vous n&apos;avez pas encore réservé de séance.</p>
          <Link to="/sessions" className="btn-primary inline-flex gap-2">
            Voir les séances <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      ) : (
        <>
          {bookings.map((booking) => {
            const startDate = new Date(booking.session.startAt);
            const isPast = startDate < now;
            return (
              <div
                key={booking.id}
                className={cn(
                  'border-b border-ink/8 px-4 py-5 transition-colors duration-150',
                  isPast ? 'opacity-50' : 'hover:bg-ink/[0.02]',
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-sans font-medium text-sm text-ink truncate">
                        {booking.session.title}
                      </h3>
                      {(() => {
                        const badgeCls = isPast
                          ? 'border-ink/10 text-faint'
                          : 'border-emerald-300 text-emerald-700 bg-emerald-50';
                        const badgeLabel = isPast ? 'Passée' : 'À venir';
                        return (
                          <span className={cn('shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 border', badgeCls)}>
                            {badgeLabel}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="space-y-1">
                      <p className="font-mono text-[11px] uppercase tracking-[0.07em] text-muted flex items-center gap-2">
                        <Clock className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                        {formatSessionDate(booking.session.startAt)} · {booking.session.durationMin} MIN
                      </p>
                      <p className="font-mono text-[11px] uppercase tracking-[0.07em] text-faint flex items-center gap-2">
                        <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                        {booking.session.locationName} · {booking.session.city}
                      </p>
                    </div>
                  </div>
                  {!isPast && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-accent hover:opacity-70 transition-opacity disabled:opacity-40 h-9 px-3 border border-accent/30 hover:border-accent"
                    >
                      {cancellingId === booking.id ? '…' : 'Annuler'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
