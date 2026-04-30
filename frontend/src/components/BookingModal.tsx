import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ArrowRight, Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createEvent } from 'ics';
import { toast } from 'sonner';
import axios from 'axios';
import { Session } from '../api/sessions';
import { bookingsApi } from '../api/bookings';
import { Avatar } from './Avatar';
import { getSportImage } from '../constants/sportImages';
import { cn, formatSessionDateLong, formatTime } from '../lib/utils';

export type ModalMode = 'book' | 'browse' | 'my-booking-upcoming' | 'my-booking-past';

interface BookingModalProps {
  session: Session | null;
  open: boolean;
  onClose: () => void;
  onBooked?: () => void;
  mode?: ModalMode;
  bookingId?: string;
  onCancelled?: () => void;
}

function downloadIcs(session: Session) {
  const start = new Date(session.startAt);
  const { error, value } = createEvent({
    title: session.title,
    description: session.description ?? '',
    location: `${session.locationName}, ${session.address}, ${session.city} ${session.postalCode}`,
    start: [
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
    ],
    duration: { minutes: session.durationMin },
    organizer: {
      name: `${session.coach.firstName} ${session.coach.lastName}`,
      email: session.coach.email,
    },
  });
  if (error ?? !value) return;
  const blob = new Blob([value ?? ''], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.title.replace(/\s+/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BookingModal({
  session,
  open,
  onClose,
  onBooked,
  mode = 'book',
  bookingId,
  onCancelled,
}: Readonly<BookingModalProps>) {
  const [step, setStep] = useState<'detail' | 'success'>('detail');
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleClose = () => {
    setStep('detail');
    setConfirmedBookingId('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await bookingsApi.create(session.id);
      setConfirmedBookingId(res.data.data.id);
      setStep('success');
      onBooked?.();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          (err.response?.data as { error?: { message?: string } })?.error?.message ??
            'Erreur lors de la réservation',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingId) return;
    if (!confirm('Annuler cette réservation ?')) return;
    setCancelling(true);
    try {
      await bookingsApi.cancel(bookingId);
      toast.success('Réservation annulée');
      onCancelled?.();
      handleClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          (err.response?.data as { error?: { message?: string } })?.error?.message ??
            "Erreur lors de l'annulation",
        );
      }
    } finally {
      setCancelling(false);
    }
  };

  if (!session) return null;

  const isFull = session.bookingsCount >= session.capacity;
  const isPast = mode === 'my-booking-past';
  const endMs = new Date(session.startAt).getTime() + session.durationMin * 60_000;
  const endTimeStr = formatTime(new Date(endMs).toISOString());
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [session.address, session.city, session.postalCode].filter(Boolean).join(', '),
  )}`;
  const coverUrl = getSportImage(session.sport, session.coverImageUrl);
  const occupancyPct = Math.round((session.bookingsCount / session.capacity) * 100);
  const spotsLeft = session.capacity - session.bookingsCount;

  const headerLabel =
    mode === 'book' ? 'Confirmer la réservation' : 'Détails de la séance';

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4 outline-none">
          <div className="bg-surface border border-ink/15 shadow-[0_24px_64px_rgba(26,26,26,0.12)] flex flex-col max-h-[85vh]">
            <AnimatePresence mode="wait">
              {step === 'detail' ? (
                <motion.div
                  key="detail"
                  className="flex flex-col min-h-0"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {/* Sticky header */}
                  <div className="shrink-0 flex justify-between items-center px-8 py-5 border-b border-ink/8">
                    <Dialog.Title className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                      {headerLabel}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="btn-ghost">
                        <X className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Scrollable body */}
                  <div className="overflow-y-auto flex-1 min-h-0">
                    {/* Cover image */}
                    <div className="relative h-[200px] shrink-0">
                      <img
                        src={coverUrl}
                        alt={session.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
                      {session.sport && (
                        <span className="absolute bottom-4 left-5 font-serif italic text-white/90 text-xl leading-none">
                          {session.sport}
                        </span>
                      )}
                      {isPast && (
                        <span className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-[0.1em] bg-ink text-paper px-2 py-1">
                          Séance passée
                        </span>
                      )}
                      {isFull && !isPast && (
                        <span className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-[0.1em] bg-accent text-white px-2 py-1">
                          Complet
                        </span>
                      )}
                    </div>

                    <div className="px-8 py-6 space-y-6">
                      {/* Title + Coach */}
                      <div>
                        <h2 className="font-serif italic text-3xl text-ink leading-tight mb-4">
                          {session.title}
                        </h2>
                        <div className="flex items-center gap-3">
                          <Avatar user={session.coach} size="sm" />
                          <div>
                            <p className="font-sans text-sm font-medium text-ink">
                              {session.coach.firstName} {session.coach.lastName}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">Coach</p>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-ink/8" />

                      {/* Date / duration / location */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-muted shrink-0 mt-0.5" strokeWidth={1.5} />
                          <div>
                            <p className="font-sans text-sm text-muted capitalize">
                              {formatSessionDateLong(session.startAt)}
                            </p>
                            <p className="font-mono text-[11px] uppercase tracking-[0.07em] text-faint mt-0.5">
                              {formatTime(session.startAt)} → {endTimeStr}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />
                          <span className="font-sans text-sm text-muted">{session.durationMin} minutes</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" strokeWidth={1.5} />
                          <div>
                            <p className="font-sans text-sm text-muted">{session.locationName}</p>
                            <p className="font-sans text-sm text-faint">
                              {session.address}, {session.postalCode} {session.city}
                            </p>
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent mt-1 hover:opacity-70 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Voir sur Maps <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-ink/8" />

                      {/* Capacity */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted flex items-center gap-1.5">
                            <Users className="w-3 h-3" strokeWidth={1.5} />
                            {session.bookingsCount}/{session.capacity} inscrits
                          </span>
                          <span className={cn('font-mono text-[10px]', isFull ? 'text-accent' : 'text-faint')}>
                            {isFull
                              ? 'Complet'
                              : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''} disponible${spotsLeft > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <div className="h-1 bg-ink/8 w-full">
                          <div
                            className={cn('h-full transition-all duration-500', isFull ? 'bg-accent' : 'bg-ink/40')}
                            style={{ width: `${occupancyPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      {session.description && (
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint mb-2">
                            À propos
                          </p>
                          <p className="font-sans text-sm text-muted leading-relaxed">
                            {session.description}
                          </p>
                        </div>
                      )}

                      {/* Requirements */}
                      {session.requirements && (
                        <div className="border-l-2 border-ink/15 pl-4">
                          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint mb-1">
                            Prérequis
                          </p>
                          <p className="font-sans text-sm text-muted">{session.requirements}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sticky footer */}
                  <div className="shrink-0 px-8 py-5 border-t border-ink/8">
                    {mode === 'book' && (
                      <div className="flex gap-3">
                        <Dialog.Close asChild>
                          <button className="btn-secondary flex-1">Annuler</button>
                        </Dialog.Close>
                        {(() => {
                          let confirmLabel: React.ReactNode = (
                            <>Confirmer <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} /></>
                          );
                          if (loading) confirmLabel = 'Réservation...';
                          else if (isFull) confirmLabel = 'Complet';
                          return (
                            <button
                              onClick={() => void handleConfirm()}
                              disabled={loading || isFull}
                              className={cn(
                                'btn-danger flex-1 gap-2',
                                isFull && 'opacity-40 cursor-not-allowed',
                              )}
                            >
                              {confirmLabel}
                            </button>
                          );
                        })()}
                      </div>
                    )}
                    {(mode === 'browse' || mode === 'my-booking-past') && (
                      <Dialog.Close asChild>
                        <button className="btn-secondary w-full">Fermer</button>
                      </Dialog.Close>
                    )}
                    {mode === 'my-booking-upcoming' && (
                      <div className="flex gap-3">
                        <Dialog.Close asChild>
                          <button className="btn-secondary flex-1">Fermer</button>
                        </Dialog.Close>
                        <button
                          onClick={() => void handleCancelBooking()}
                          disabled={cancelling}
                          className="btn-danger flex-1"
                        >
                          {cancelling ? '…' : 'Annuler ma réservation'}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="px-8 py-10"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted mb-3">
                    Confirmé
                  </p>
                  <div className="relative h-px bg-ink/10 mb-8 overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-ink animate-draw" />
                  </div>
                  <p className="font-mono text-5xl font-medium text-ink tracking-tight leading-none mb-2 font-tabular">
                    #{confirmedBookingId.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="font-sans text-sm text-muted mb-1">
                    Place réservée pour{' '}
                    <span className="text-ink font-medium">{session.title}</span>
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint mb-8">
                    {formatSessionDateLong(session.startAt)} · {formatTime(session.startAt)}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => downloadIcs(session)}
                      className="btn-secondary w-full gap-2 justify-center"
                    >
                      <Download className="w-4 h-4" strokeWidth={1.5} />
                      Ajouter au calendrier (.ics)
                    </button>
                    <Link
                      to="/bookings"
                      onClick={handleClose}
                      className="btn-secondary w-full text-center justify-center"
                    >
                      Voir mes réservations
                    </Link>
                    <button onClick={handleClose} className="btn-primary w-full">
                      Fermer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
