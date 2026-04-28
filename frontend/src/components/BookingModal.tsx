import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ArrowRight, Calendar, Clock, MapPin } from 'lucide-react';
import { createEvent } from 'ics';
import { toast } from 'sonner';
import axios from 'axios';
import { Session } from '../api/sessions';
import { bookingsApi } from '../api/bookings';
import { formatSessionDateLong, formatTime } from '../lib/utils';

interface BookingModalProps {
  session: Session | null;
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
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

export function BookingModal({ session, open, onClose, onBooked }: Readonly<BookingModalProps>) {
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setStep('confirm');
    setBookingId('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await bookingsApi.create(session.id);
      setBookingId(res.data.data.id);
      setStep('success');
      onBooked();
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

  if (!session) return null;

  const isFull = session.bookingsCount >= session.capacity;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4 outline-none">
          <div className="bg-surface border border-ink/15 shadow-[0_24px_64px_rgba(26,26,26,0.12)]">
            <AnimatePresence mode="wait">
              {step === 'confirm' ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center px-8 py-5 border-b border-ink/8">
                    <Dialog.Title className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                      Confirmer la réservation
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button className="btn-ghost">
                        <X className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </Dialog.Close>
                  </div>

                  {/* Body */}
                  <div className="px-8 py-7 space-y-6">
                    <h2 className="font-serif italic text-3xl text-ink leading-tight">
                      {session.title}
                    </h2>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />
                        <span className="font-sans text-sm text-muted">
                          {formatSessionDateLong(session.startAt)} à {formatTime(session.startAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />
                        <span className="font-sans text-sm text-muted">{session.durationMin} minutes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted shrink-0" strokeWidth={1.5} />
                        <span className="font-sans text-sm text-muted">
                          {session.locationName}, {session.city}
                        </span>
                      </div>
                    </div>

                    {session.requirements && (
                      <div className="border-l-2 border-ink/15 pl-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint mb-1">
                          Prérequis
                        </p>
                        <p className="font-sans text-sm text-muted">{session.requirements}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Dialog.Close asChild>
                        <button className="btn-secondary flex-1">Annuler</button>
                      </Dialog.Close>
                      {(() => {
                        let confirmLabel: React.ReactNode = <>Confirmer <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} /></>;
                        if (loading) confirmLabel = 'Réservation...';
                        else if (isFull) confirmLabel = 'Complet';
                        return (
                          <button
                            onClick={() => void handleConfirm()}
                            disabled={loading || isFull}
                            className="btn-danger flex-1 gap-2"
                          >
                            {confirmLabel}
                          </button>
                        );
                      })()}
                    </div>
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
                  {/* Confirmé label */}
                  <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted mb-3">
                    Confirmé
                  </p>

                  {/* Animated underline */}
                  <div className="relative h-px bg-ink/10 mb-8 overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-ink animate-draw" />
                  </div>

                  {/* Ticket number */}
                  <p className="font-mono text-5xl font-medium text-ink tracking-tight leading-none mb-2 font-tabular">
                    #{bookingId.slice(0, 8).toUpperCase()}
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
