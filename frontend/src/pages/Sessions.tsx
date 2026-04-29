import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { LayoutGrid, List, SlidersHorizontal, X, ArrowRight, Search } from 'lucide-react';
import { sessionsApi, Session } from '../api/sessions';
import { useAuth } from '../context/AuthContext';
import { SessionCard } from '../components/SessionCard';
import { SessionRowSkeleton } from '../components/Skeleton';
import { BookingModal } from '../components/BookingModal';
import { Pagination } from '../components/Pagination';
import { DateRangePicker, type DateRange } from '../components/ui/DateRangePicker';
import { formatSessionDate, cn } from '../lib/utils';

const SKELETON_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5', 'sk-6'];

type ViewMode = 'list' | 'grid';

export function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearchQuery(value); setPage(1); }, 300);
  };

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (dateRange?.from) params.from = dateRange.from.toISOString();
      if (dateRange?.to) params.to = dateRange.to.toISOString();
      if (searchQuery) params.q = searchQuery;
      const res = await sessionsApi.list(params);
      setSessions(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Erreur lors du chargement des séances');
    } finally {
      setLoading(false);
    }
  }, [page, dateRange, searchQuery]);

  useEffect(() => { void fetchSessions(); }, [fetchSessions]);

  const openBooking = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) { setSelectedSession(session); setBookingModalOpen(true); }
  };

  const resetFilters = () => { setDateRange(undefined); setSearchInput(''); setSearchQuery(''); setPage(1); };
  const hasFilters = !!(dateRange?.from) || !!searchQuery;
  const plural = meta.total === 1 ? '' : 's';

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6 pb-6 border-b border-ink/8">
        <div>
          <h1 className="font-serif italic text-[clamp(32px,4vw,48px)] text-ink leading-tight tracking-tight">
            Séances
          </h1>
          {!loading && (
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-1">
              {meta.total} séance{plural} disponible{plural}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] h-9 px-3 border transition-colors duration-150',
              filtersOpen || hasFilters
                ? 'border-ink text-ink bg-ink/5'
                : 'border-ink/15 text-muted hover:border-ink/40 hover:text-ink',
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
            Filtres
            {hasFilters && (
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
            )}
          </button>

          {/* View toggle */}
          <div className="flex border border-ink/15">
            <button
              onClick={() => setViewMode('list')}
              className={cn('w-9 h-9 flex items-center justify-center transition-colors duration-150', viewMode === 'list' ? 'bg-ink text-paper' : 'text-muted hover:text-ink')}
              aria-label="Vue liste"
            >
              <List className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn('w-9 h-9 flex items-center justify-center transition-colors duration-150 border-l border-ink/15', viewMode === 'grid' ? 'bg-ink text-paper' : 'text-muted hover:text-ink')}
              aria-label="Vue grille"
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" strokeWidth={1.5} />
        <input
          type="search"
          placeholder="Rechercher par titre, ville, lieu…"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="input-field pl-9 text-sm w-full"
          aria-label="Rechercher des séances"
        />
      </div>

      {/* Filters drawer */}
      {filtersOpen && (
        <div className="mb-6 p-5 border border-ink/10 bg-surface-alt">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Filtrer par date</p>
            {hasFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent hover:opacity-70 transition-opacity">
                <X className="w-3 h-3" strokeWidth={1.5} />Effacer
              </button>
            )}
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={(r) => { setDateRange(r); setPage(1); }}
            placeholder="Sélectionner une période"
          />
        </div>
      )}

      {/* Content */}
      {renderContent({ loading, sessions, viewMode, user, openBooking, hasFilters, resetFilters })}

      <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />

      <BookingModal
        session={selectedSession}
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onBooked={() => { void fetchSessions(); }}
      />
    </div>
  );
}

interface ContentProps {
  loading: boolean;
  sessions: Session[];
  viewMode: ViewMode;
  user: { role: string } | null;
  openBooking: (id: string) => void;
  hasFilters: boolean;
  resetFilters: () => void;
}

function renderContent({ loading, sessions, viewMode, user, openBooking, hasFilters, resetFilters }: ContentProps) {
  if (loading) {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SKELETON_KEYS.map((k) => (
            <div key={k} className="bg-surface border border-ink/10 p-5 space-y-3">
              <div className="shimmer-line h-5 w-3/4" />
              <div className="shimmer-line h-3 w-1/2" />
              <div className="shimmer-line h-9 w-full mt-3" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div>
        <SessionListHeader />
        {SKELETON_KEYS.map((k) => <SessionRowSkeleton key={k} />)}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif italic text-3xl text-ink/30 mb-3">Rien ici. Pour l&apos;instant.</p>
        {hasFilters && (
          <button onClick={resetFilters} className="btn-secondary mt-4 text-xs">
            Effacer les filtres
          </button>
        )}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onBook={user?.role === 'CLIENT' ? openBooking : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <SessionListHeader />
      {sessions.map((session) => (
        <SessionListRow
          key={session.id}
          session={session}
          canBook={user?.role === 'CLIENT'}
          onBook={openBooking}
        />
      ))}
    </div>
  );
}

function SessionListHeader() {
  return (
    <div className="hidden md:grid grid-cols-[1fr_180px_200px_64px_100px] gap-4 px-4 py-2 border-b border-ink/10">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Titre</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Encadrant</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Date</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Places</span>
      <span />
    </div>
  );
}

interface RowProps { session: Session; canBook?: boolean; onBook: (id: string) => void }

function SessionListRow({ session, canBook, onBook }: Readonly<RowProps>) {
  const isFull = session.bookingsCount >= session.capacity;
  return (
    <div className="group relative border-b border-ink/8 hover:bg-ink/[0.02] transition-colors duration-100">
      {/* Accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-150 origin-center" />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_200px_64px_100px] gap-2 md:gap-4 px-4 py-4 items-center">
        {/* Title */}
        <div>
          <p className="font-sans font-medium text-sm text-ink session-title-hover leading-snug">
            {session.title}
          </p>
          {session.locationName && (
            <p className="font-mono text-[10px] uppercase tracking-[0.07em] text-faint mt-0.5 md:hidden">
              {session.locationName} · {session.city}
            </p>
          )}
        </div>
        {/* Coach */}
        <p className="hidden md:block font-sans text-sm text-muted">
          {session.coach.firstName} {session.coach.lastName}
        </p>
        {/* Date */}
        <p className="font-mono text-[11px] uppercase tracking-[0.07em] text-muted hidden md:block">
          {formatSessionDate(session.startAt)}
        </p>
        {/* Spots */}
        <p className={cn('font-mono text-[11px] tabular-nums hidden md:block', isFull ? 'text-accent' : 'text-muted')}>
          {String(session.bookingsCount).padStart(2, '0')}/{String(session.capacity).padStart(2, '0')}
        </p>
        {/* Action */}
        {canBook ? (
          <button
            onClick={() => onBook(session.id)}
            disabled={isFull}
            className={cn(
              'justify-self-end font-mono text-[10px] uppercase tracking-[0.1em] flex items-center gap-1 transition-colors duration-150',
              isFull ? 'text-faint cursor-not-allowed' : 'text-ink hover:text-accent',
            )}
          >
            {isFull ? 'Complet' : <>Réserver <ArrowRight className="w-3 h-3" strokeWidth={1.5} /></>}
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.07em] text-faint justify-self-end hidden md:block">
            {formatSessionDate(session.startAt)}
          </span>
        )}
      </div>
    </div>
  );
}
