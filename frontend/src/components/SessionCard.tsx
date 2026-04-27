import { Clock, MapPin, User, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { Session } from '../api/sessions';

interface SessionCardProps {
  session: Session;
  onBook?: (sessionId: string) => void;
  onEdit?: (session: Session) => void;
  onDelete?: (sessionId: string) => void;
  onViewParticipants?: (session: Session) => void;
  booking?: boolean;
  loading?: boolean;
}

const gradients = [
  'from-orange-500/80 to-rose-600/80',
  'from-violet-500/80 to-indigo-600/80',
  'from-emerald-500/80 to-teal-600/80',
  'from-amber-500/80 to-orange-600/80',
  'from-sky-500/80 to-blue-600/80',
  'from-pink-500/80 to-rose-600/80',
];

function pickGradient(id: string) {
  const n = (id.codePointAt(0) ?? 0) + (id.codePointAt(id.length - 1) ?? 0);
  return gradients[n % gradients.length];
}

export function SessionCard({
  session,
  onBook,
  onEdit,
  onDelete,
  onViewParticipants,
  booking = false,
  loading = false,
}: Readonly<SessionCardProps>) {
  const isFull = session.bookingsCount >= session.capacity;
  const startDate = new Date(session.startAt);
  const fillPct = Math.round((session.bookingsCount / session.capacity) * 100);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 flex flex-col">
      {/* Gradient header strip */}
      <div className={cn('h-1.5 bg-gradient-to-r', pickGradient(session.id))} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-3">
          <h3 className="font-semibold text-base text-gray-100 leading-tight">{session.title}</h3>
          <span
            className={cn(
              'shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full',
              isFull
                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
            )}
          >
            {isFull ? 'Complet' : 'Disponible'}
          </span>
        </div>

        {session.description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{session.description}</p>
        )}

        <div className="space-y-1.5 text-sm text-gray-400 mb-4 flex-1">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <span>
              {startDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              {' · '}
              {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {session.durationMin} min
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <span>{session.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <span>{session.coach.firstName} {session.coach.lastName}</span>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{session.bookingsCount}/{session.capacity} places</span>
            <span>{fillPct}%</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', isFull ? 'bg-red-500' : 'bg-accent')}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {onBook && (() => {
            const bookLabel = isFull ? 'Complet' : 'Réserver';
            return (
              <button
                onClick={() => onBook(session.id)}
                disabled={isFull || loading || booking}
                className="btn-primary text-sm flex-1"
              >
                {booking ? 'Réservation...' : bookLabel}
              </button>
            );
          })()}
          {onViewParticipants && (
            <button onClick={() => onViewParticipants(session)} className="btn-secondary text-sm">
              <Users className="w-3.5 h-3.5" />
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit(session)} className="btn-secondary text-sm flex-1">
              Modifier
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(session.id)} className="btn-danger text-sm">
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
