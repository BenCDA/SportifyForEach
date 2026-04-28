import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, X, Users } from 'lucide-react';
import { sessionsApi, Session } from '../api/sessions';
import { useAuth } from '../context/AuthContext';
import { SessionCard } from '../components/SessionCard';
import { SessionCardSkeleton } from '../components/Skeleton';
import { Pagination } from '../components/Pagination';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { getSportImage } from '../constants/sportImages';
import axios from 'axios';

const ALL_SPORTS = [
  'Arts martiaux', 'Basketball', 'Boxe', 'Course à pied', 'Cross-training',
  'Crossfit', 'Cyclisme', 'Danse', 'Escalade', 'Fitness', 'Football', 'Golf',
  'HIIT', 'Méditation', 'MMA', 'Musculation', 'Natation', 'Pilates',
  'Préparation physique', 'Rééducation', 'Rugby', 'Self-défense', 'Ski',
  'Stretching', 'Surf', 'Tennis', 'Volleyball', 'Yoga',
];

const sessionSchema = z.object({
  title:        z.string().min(1, 'Titre requis'),
  sport:        z.string().optional(),
  description:  z.string().optional(),
  requirements: z.string().optional(),
  startAt:      z.string().min(1, 'Date requise'),
  durationMin:  z.number().int().min(1, 'Durée requise'),
  capacity:     z.number().int().min(1, 'Capacité requise'),
  locationName: z.string().min(1, 'Nom du lieu requis'),
  address:      z.string().min(1, 'Adresse requise'),
  city:         z.string().min(1, 'Ville requise'),
  postalCode:   z.string().min(1, 'Code postal requis'),
  latitude:     z.number().optional(),
  longitude:    z.number().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;
type Participant = { id: string; firstName: string; lastName: string };

const EMPTY: Partial<SessionFormData> = {
  durationMin: 60, capacity: 10, sport: '',
  locationName: '', address: '', city: '', postalCode: '',
};

export function CoachPlanning() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[] | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<SessionFormData>({ resolver: zodResolver(sessionSchema), defaultValues: EMPTY });

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionsApi.list({ page, limit: 10, coachId: user!.id });
      setSessions(res.data.data);
      setMeta(res.data.meta);
    } catch { toast.error('Erreur lors du chargement'); }
    finally { setLoading(false); }
  }, [page, user]);

  useEffect(() => { void fetchSessions(); }, [fetchSessions]);

  const openCreate = () => { setEditingSession(null); reset(EMPTY); setShowModal(true); };

  const openEdit = (session: Session) => {
    setEditingSession(session);
    const startAt = new Date(session.startAt).toISOString().slice(0, 16);
    reset({
      title: session.title, sport: session.sport ?? '',
      description: session.description ?? '',
      requirements: session.requirements ?? '', startAt,
      durationMin: session.durationMin, capacity: session.capacity,
      locationName: session.locationName, address: session.address,
      city: session.city, postalCode: session.postalCode,
      latitude: session.latitude ?? undefined, longitude: session.longitude ?? undefined,
    });
    setValue('startAt', startAt);
    setShowModal(true);
  };

  const onSubmit = async (data: SessionFormData) => {
    try {
      const payload = { ...data, startAt: new Date(data.startAt).toISOString() };
      if (editingSession) {
        await sessionsApi.update(editingSession.id, payload);
        toast.success('Séance modifiée');
      } else {
        await sessionsApi.create(payload);
        toast.success('Séance créée');
      }
      setShowModal(false);
      void fetchSessions();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(
          (err.response?.data as { error?: { message?: string } })?.error?.message ?? 'Erreur',
        );
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette séance ?')) return;
    try {
      await sessionsApi.delete(id);
      toast.success('Séance supprimée');
      void fetchSessions();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const handleViewParticipants = async (session: Session) => {
    try {
      const res = await sessionsApi.get(session.id);
      setParticipants((res.data.data.participants as Participant[]) ?? []);
    } catch { toast.error('Erreur lors du chargement des participants'); }
  };

  const plural = meta.total === 1 ? '' : 's';

  return (
    <div>
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-ink/8">
        <div>
          <h1 className="font-serif italic text-[clamp(32px,4vw,48px)] text-ink leading-tight tracking-tight">
            Mon planning
          </h1>
          {!loading && (
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-1">
              {meta.total} séance{plural}
            </p>
          )}
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nouvelle séance
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((k) => <SessionCardSkeleton key={k} />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif italic text-3xl text-ink/30 mb-3">Aucune séance créée.</p>
          <button onClick={openCreate} className="btn-primary mt-4 gap-2">
            <Plus className="w-4 h-4" strokeWidth={1.5} />Créer une séance
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session}
                onEdit={openEdit} onDelete={handleDelete}
                onViewParticipants={handleViewParticipants} />
            ))}
          </div>
          <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />
        </>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-ink/15 w-full max-w-lg shadow-[0_24px_64px_rgba(26,26,26,0.12)] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-7 py-5 border-b border-ink/8 shrink-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                {editingSession ? 'Modifier la séance' : 'Créer une séance'}
              </p>
              <button onClick={() => setShowModal(false)} className="btn-ghost">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-7 space-y-6 overflow-y-auto">
              <div>
                <label htmlFor="s-title" className="input-label">Titre *</label>
                <input {...register('title')} id="s-title" className="input-field" placeholder="Yoga du matin" />
                {errors.title && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.title.message}</p>}
              </div>

              {/* Sport */}
              <div>
                <label htmlFor="s-sport" className="input-label">Sport</label>
                <select {...register('sport')} id="s-sport" className="input-field bg-transparent">
                  <option value="">— Sélectionner un sport —</option>
                  {ALL_SPORTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {/* Sport image preview */}
                {watch('sport') && (
                  <div className="mt-2 h-20 overflow-hidden rounded-sm border border-ink/10">
                    <img
                      src={getSportImage(watch('sport'))}
                      alt={watch('sport')}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="s-desc" className="input-label">Description</label>
                <textarea {...register('description')} id="s-desc" className="input-field resize-none" rows={2} />
              </div>

              <div>
                <label htmlFor="s-req" className="input-label">Prérequis</label>
                <textarea {...register('requirements')} id="s-req" className="input-field resize-none" rows={2}
                  placeholder="Équipement, niveau requis…" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label htmlFor="s-start" className="input-label">Date et heure *</label>
                  <input {...register('startAt')} id="s-start" type="datetime-local" className="input-field" />
                  {errors.startAt && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.startAt.message}</p>}
                </div>
                <div>
                  <label htmlFor="s-dur" className="input-label">Durée (min) *</label>
                  <input {...register('durationMin', { valueAsNumber: true })} id="s-dur" type="number" className="input-field" />
                  {errors.durationMin && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.durationMin.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="s-cap" className="input-label">Capacité *</label>
                <input {...register('capacity', { valueAsNumber: true })} id="s-cap" type="number" className="input-field" />
                {errors.capacity && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.capacity.message}</p>}
              </div>

              {/* Location */}
              <div className="pt-2 border-t border-ink/8">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted mb-5">Lieu</p>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="s-locname" className="input-label">Nom du lieu *</label>
                    <input {...register('locationName')} id="s-locname" className="input-field" placeholder="Studio Yoga Zen" />
                    {errors.locationName && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.locationName.message}</p>}
                  </div>

                  <div>
                    <p className="input-label">Recherche d&apos;adresse</p>
                    <LocationAutocomplete
                      onSelect={(loc) => {
                        setValue('address', loc.address, { shouldValidate: true });
                        setValue('city', loc.city, { shouldValidate: true });
                        setValue('postalCode', loc.postalCode, { shouldValidate: true });
                        if (loc.latitude) setValue('latitude', loc.latitude);
                        if (loc.longitude) setValue('longitude', loc.longitude);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="s-addr" className="input-label">Adresse *</label>
                      <input {...register('address')} id="s-addr" className="input-field" placeholder="12 rue de Béthune" />
                      {errors.address && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.address.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="s-city" className="input-label">Ville *</label>
                      <input {...register('city')} id="s-city" className="input-field" placeholder="Lille" />
                      {errors.city && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.city.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="s-postal" className="input-label">Code postal *</label>
                    <input {...register('postalCode')} id="s-postal" className="input-field" placeholder="59000" />
                    {errors.postalCode && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.postalCode.message}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? '…' : editingSession ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participants modal */}
      {participants !== null && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-ink/15 w-full max-w-md shadow-[0_24px_64px_rgba(26,26,26,0.12)]">
            <div className="flex justify-between items-center px-7 py-5 border-b border-ink/8">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted flex items-center gap-2">
                <Users className="w-3.5 h-3.5" strokeWidth={1.5} />Participants
              </p>
              <button onClick={() => setParticipants(null)} className="btn-ghost">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-5">
              {participants.length === 0 ? (
                <p className="font-serif italic text-xl text-ink/30 text-center py-6">Aucun inscrit.</p>
              ) : (
                <ul className="divide-y divide-ink/6">
                  {participants.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-3">
                      <span className="w-7 h-7 bg-ink text-paper rounded-full flex items-center justify-center font-mono text-[10px] shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </span>
                      <span className="font-sans text-sm text-ink">{p.firstName} {p.lastName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
