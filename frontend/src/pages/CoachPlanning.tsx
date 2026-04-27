import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, X, Users, Calendar } from 'lucide-react';
import { sessionsApi, Session } from '../api/sessions';
import { useAuth } from '../context/AuthContext';
import { SessionCard } from '../components/SessionCard';
import { SessionCardSkeleton } from '../components/Skeleton';
import { Pagination } from '../components/Pagination';
import axios from 'axios';

const sessionSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  startAt: z.string().min(1, 'Date requise'),
  durationMin: z.number().int().min(1, 'Durée requise'),
  capacity: z.number().int().min(1, 'Capacité requise'),
  location: z.string().min(1, 'Lieu requis'),
});

type SessionFormData = z.infer<typeof sessionSchema>;

type Participant = { id: string; firstName: string; lastName: string };

export function CoachPlanning() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[] | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { durationMin: 60, capacity: 10 },
  });

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionsApi.list({ page, limit: 10, coachId: user!.id });
      setSessions(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page, user]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const openCreate = () => {
    setEditingSession(null);
    reset({ durationMin: 60, capacity: 10 });
    setShowModal(true);
  };

  const openEdit = (session: Session) => {
    setEditingSession(session);
    const startAt = new Date(session.startAt).toISOString().slice(0, 16);
    reset({
      title: session.title,
      description: session.description ?? '',
      startAt,
      durationMin: session.durationMin,
      capacity: session.capacity,
      location: session.location,
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
        toast.error(err.response?.data?.error?.message as string ?? 'Erreur');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette séance ?')) return;
    try {
      await sessionsApi.delete(id);
      toast.success('Séance supprimée');
      void fetchSessions();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleViewParticipants = async (session: Session) => {
    try {
      const res = await sessionsApi.get(session.id);
      setParticipants((res.data.data.participants as Participant[]) ?? []);
    } catch {
      toast.error('Erreur lors du chargement des participants');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Mon planning</h1>
          {loading ? null : (
            <p className="text-sm text-gray-500 mt-0.5">{meta.total} séance{meta.total !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" />Nouvelle séance
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['sk-1', 'sk-2', 'sk-3', 'sk-4'].map((k) => <SessionCardSkeleton key={k} />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-gray-600" />
          </div>
          <h3 className="text-gray-300 font-medium mb-1">Aucune séance créée</h3>
          <p className="text-gray-600 text-sm mb-4">Créez votre première séance pour commencer.</p>
          <button onClick={openCreate} className="btn-primary text-sm">
            Créer une séance
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={openEdit}
                onDelete={handleDelete}
                onViewParticipants={handleViewParticipants}
              />
            ))}
          </div>
          <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />
        </>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-gray-100">
                {editingSession ? 'Modifier la séance' : 'Créer une séance'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label htmlFor="s-title" className="block text-sm font-medium text-gray-300 mb-1.5">Titre *</label>
                <input {...register('title')} id="s-title" className="input-field" placeholder="Ex: Yoga du matin" />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label htmlFor="s-desc" className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea {...register('description')} id="s-desc" className="input-field resize-none" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="s-start" className="block text-sm font-medium text-gray-300 mb-1.5">Date et heure *</label>
                  <input {...register('startAt')} id="s-start" type="datetime-local" className="input-field" />
                  {errors.startAt && <p className="text-red-400 text-xs mt-1">{errors.startAt.message}</p>}
                </div>
                <div>
                  <label htmlFor="s-dur" className="block text-sm font-medium text-gray-300 mb-1.5">Durée (min) *</label>
                  <input {...register('durationMin', { valueAsNumber: true })} id="s-dur" type="number" className="input-field" />
                  {errors.durationMin && <p className="text-red-400 text-xs mt-1">{errors.durationMin.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="s-cap" className="block text-sm font-medium text-gray-300 mb-1.5">Capacité *</label>
                  <input {...register('capacity', { valueAsNumber: true })} id="s-cap" type="number" className="input-field" />
                  {errors.capacity && <p className="text-red-400 text-xs mt-1">{errors.capacity.message}</p>}
                </div>
                <div>
                  <label htmlFor="s-loc" className="block text-sm font-medium text-gray-300 mb-1.5">Lieu *</label>
                  <input {...register('location')} id="s-loc" className="input-field" placeholder="Salle A" />
                  {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? '...' : (editingSession ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participants modal */}
      {participants !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-accent" />Participants
              </h2>
              <button onClick={() => setParticipants(null)} className="btn-ghost p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Aucun participant inscrit</p>
              ) : (
                <ul className="space-y-1">
                  {participants.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors">
                      <div className="w-8 h-8 bg-accent/15 text-accent rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <span className="text-gray-200 text-sm">{p.firstName} {p.lastName}</span>
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
