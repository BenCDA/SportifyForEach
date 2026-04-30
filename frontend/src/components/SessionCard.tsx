import React from 'react';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { cn, formatSessionDate } from '../lib/utils';
import { Session } from '../api/sessions';
import { Avatar } from './Avatar';
import { getSportImage } from '../constants/sportImages';

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
  const isFull    = session.bookingsCount >= session.capacity;
  const spotsLeft = session.capacity - session.bookingsCount;
  const coverUrl  = getSportImage(session.sport, session.coverImageUrl);

  return (
    <div className="group relative bg-surface border border-ink/10 overflow-hidden transition-colors duration-200 hover:border-ink/25 flex flex-col">
      {/* Stretched click target — sits behind all content, only rendered for CLIENT view */}
      {onBook && (
        <button
          aria-label={`Voir ${session.title}`}
          onClick={() => onBook(session.id)}
          className="absolute inset-0 z-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
      )}

      {/* Cover image */}
      <div className="relative h-48 overflow-hidden bg-ink/5 pointer-events-none">
        <img
          src={coverUrl}
          alt={session.sport ?? session.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {session.sport && (
          <div className="absolute inset-0 bg-black/20 flex items-end p-4">
            <span className="font-serif italic text-white/90 text-lg leading-none">
              {session.sport}
            </span>
          </div>
        )}
        {isFull && (
          <span className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-[0.1em] bg-accent text-white px-2 py-1">
            Complet
          </span>
        )}
      </div>

      <div className="relative z-10 p-5 flex flex-col gap-3 flex-1">
        {/* Title + availability */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="session-title-hover font-sans font-semibold text-base text-ink leading-snug">
            {session.title}
          </h3>
          <span className={cn('shrink-0 font-mono text-[11px] tabular-nums', isFull ? 'text-accent' : 'text-muted')}>
            {String(session.bookingsCount).padStart(2, '0')}/{String(session.capacity).padStart(2, '0')}
          </span>
        </div>

        {/* Meta */}
        <div className="space-y-1 pointer-events-none">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
            {formatSessionDate(session.startAt)} · {session.durationMin} MIN
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint flex items-center gap-1.5">
            <MapPin className="w-3 h-3" strokeWidth={1.5} />
            {session.locationName} · {session.city}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Avatar user={session.coach} size="sm" />
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              {session.coach.firstName.toUpperCase()} {session.coach.lastName.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="h-px bg-ink/8 w-full pointer-events-none">
          <div
            className={cn('h-full transition-all duration-500', isFull ? 'bg-accent' : 'bg-ink/30')}
            style={{ width: `${Math.round((session.bookingsCount / session.capacity) * 100)}%` }}
          />
        </div>

        {/* Actions — z-10 so they sit above the stretched button */}
        <div className="flex flex-wrap gap-2 pt-1">
          {onBook && (() => {
            let label: React.ReactNode = <>Réserver <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} /></>;
            if (booking) label = 'Réservation...';
            else if (isFull) label = 'Complet';
            return (
              <button
                onClick={(e) => { e.stopPropagation(); onBook(session.id); }}
                disabled={isFull || booking}
                className={cn('relative z-10 btn-danger text-[11px] h-10 px-4 flex-1', isFull && 'opacity-40 cursor-not-allowed')}
              >
                {label}
              </button>
            );
          })()}
          {onViewParticipants && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewParticipants(session); }}
              className="relative z-10 btn-secondary text-[11px] h-10 px-3"
            >
              Participants
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(session); }}
              className="relative z-10 btn-secondary text-[11px] h-10 px-4 flex-1"
            >
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
              className="relative z-10 btn-ghost text-[11px] text-accent hover:text-accent/70 font-mono uppercase tracking-[0.08em] h-10 px-3"
            >
              Supprimer
            </button>
          )}
        </div>

        {!isFull && spotsLeft <= 3 && onBook && (
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent pointer-events-none">
            {spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
