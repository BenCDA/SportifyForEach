import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { sessionsApi, Session } from '../api/sessions';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '../components/Skeleton';
import { formatSessionDate, cn } from '../lib/utils';

function TableRowSkeleton() {
  return (
    <tr className="border-b border-ink/8">
      <td className="px-5 py-4"><Skeleton className="h-3.5 w-44" /></td>
      <td className="px-5 py-4"><Skeleton className="h-3.5 w-32" /></td>
      <td className="px-5 py-4"><Skeleton className="h-3.5 w-28" /></td>
      <td className="px-5 py-4"><Skeleton className="h-3.5 w-14" /></td>
      <td className="px-5 py-4" />
    </tr>
  );
}

interface KPI { total: number; upcoming: number; past: number }

export function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<KPI | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const [res, upcomingRes, pastRes] = await Promise.all([
        sessionsApi.list({ page, limit: 10 }),
        sessionsApi.list({ from: now, limit: 1, page: 1 }),
        sessionsApi.list({ to: now, limit: 1, page: 1 }),
      ]);
      setSessions(res.data.data);
      setMeta(res.data.meta);
      setKpi({
        total:    res.data.meta.total,
        upcoming: upcomingRes.data.meta.total,
        past:     pastRes.data.meta.total,
      });
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void fetchSessions(); }, [fetchSessions]);

  const handleDelete = async (sessionId: string, title: string) => {
    if (!confirm(`Supprimer "${title}" et toutes ses réservations ?`)) return;
    try {
      await sessionsApi.delete(sessionId);
      toast.success('Séance supprimée');
      void fetchSessions();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const plural = meta.total === 1 ? '' : 's';

  return (
    <div>
      <div className="mb-8 pb-6 border-b border-ink/8">
        <h1 className="font-serif italic text-[clamp(32px,4vw,48px)] text-ink leading-tight tracking-tight">
          Séances
        </h1>
        {!loading && (
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-1">
            {meta.total} séance{plural} au total
          </p>
        )}
      </div>

      {kpi && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total',   value: kpi.total,    accent: false },
            { label: 'À venir', value: kpi.upcoming, accent: false },
            { label: 'Passées', value: kpi.past,     accent: false },
          ].map(({ label, value, accent }) => (
            <div key={label} className="border border-ink/10 bg-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint mb-2">{label}</p>
              <p className={`font-serif italic text-4xl leading-none ${accent ? 'text-accent' : 'text-ink'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-ink/10">
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Titre</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Coach</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Date</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Places</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? (['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const).map((k) => <TableRowSkeleton key={k} />)
              : sessions.map((session) => {
                  const isPast = new Date(session.startAt) < new Date();
                  const isFull = session.bookingsCount >= session.capacity;
                  return (
                    <tr key={session.id} className="border-b border-ink/8 hover:bg-ink/[0.02] transition-colors duration-100">
                      <td className="px-5 py-4">
                        <span className="font-sans font-medium text-sm text-ink">{session.title}</span>
                        {isPast && (
                          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.08em] text-faint border border-ink/15 px-1.5 py-0.5">
                            Passée
                          </span>
                        )}
                        {session.sport && (
                          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted border border-ink/10 px-1.5 py-0.5">
                            {session.sport}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-sans text-sm text-muted">
                        {session.coach.firstName} {session.coach.lastName}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-faint">
                        {formatSessionDate(session.startAt)}
                      </td>
                      <td className={cn('px-5 py-4 font-mono text-[11px] tabular-nums', isFull ? 'text-accent' : 'text-muted')}>
                        {session.bookingsCount}/{session.capacity}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => void handleDelete(session.id, session.title)}
                          className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent hover:opacity-70 transition-opacity"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />
    </div>
  );
}
