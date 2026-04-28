import React from 'react';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { cn, formatSessionDate } from '../lib/utils';
import { Session } from '../api/sessions';

interface SessionCardProps {
  session: Session;
  onBook?: (sessionId: string) => void;
  onEdit?: (session: Session) => void;
  onDelete?: (sessionId: string) => void;
  onViewParticipants?: (session: Session) => void;
  booking?: boolean;
}

export function SessionCard({
  session,
  onBook,
  onEdit,
  onDelete,
  onViewParticipants,
  booking = false,
}: Readonly<SessionCardProps>) {
  const isFull = session.bookingsCount >= session.capacity;
  const spotsLeft = session.capacity - session.bookingsCount;
  const watermark = session.title.split(' ')[0].toUpperCase();

  return (
    <div className="group relative bg-surface border border-ink/10 overflow-hidden transition-colors duration-200 hover:border-ink/25">
      {/* Watermark */}
      <span
        aria-hidden
        className="absolute -bottom-3 -right-2 font-serif italic text-[6rem] leading-none text-ink/[0.04] select-none pointer-events-none whitespace-nowrap"
      >
        {watermark}
      </span>

      <div className="relative p-5 flex flex-col gap-3">
        {/* Title + availability */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="session-title-hover font-sans font-semibold text-base text-ink leading-snug">
            {session.title}
          </h3>
          <span
            className={cn(
              'shrink-0 font-mono text-[11px] tabular-nums',
              isFull ? 'text-accent' : 'text-muted',
            )}
          >
            {String(session.bookingsCount).padStart(2, '0')}/{String(session.capacity).padStart(2, '0')}
          </span>
        </div>

        {/* Meta */}
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
            {formatSessionDate(session.startAt)} · {session.durationMin} MIN
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint flex items-center gap-1.5">
            <MapPin className="w-3 h-3" strokeWidth={1.5} />
            {session.locationName} · {session.city}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint flex items-center gap-1.5">
            <Clock className="w-3 h-3" strokeWidth={1.5} />
            ENCADRÉ PAR {session.coach.firstName.toUpperCase()} {session.coach.lastName.toUpperCase()}
          </p>
        </div>

        {/* Capacity bar */}
        <div className="h-px bg-ink/8 w-full">
          <div
            className={cn('h-full transition-all duration-500', isFull ? 'bg-accent' : 'bg-ink/30')}
            style={{ width: `${Math.round((session.bookingsCount / session.capacity) * 100)}%` }}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {onBook && (() => {
            let label: React.ReactNode = <>Réserver <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} /></>;
            if (booking) label = 'Réservation...';
            else if (isFull) label = 'Complet';
            return (
              <button
                onClick={() => onBook(session.id)}
                disabled={isFull || booking}
                className={cn('btn-danger text-[11px] h-10 px-4 flex-1', isFull && 'opacity-40 cursor-not-allowed')}
              >
                {label}
              </button>
            );
          })()}
          {onViewParticipants && (
            <button onClick={() => onViewParticipants(session)} className="btn-secondary text-[11px] h-10 px-3">
              Participants
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit(session)} className="btn-secondary text-[11px] h-10 px-4 flex-1">
              Modifier
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(session.id)} className="btn-ghost text-[11px] text-accent hover:text-accent/70 font-mono uppercase tracking-[0.08em] h-10 px-3">
              Supprimer
            </button>
          )}
        </div>

        {!isFull && spotsLeft <= 3 && onBook && (
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent">
            {spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
