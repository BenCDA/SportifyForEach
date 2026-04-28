import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { usersApi } from '../api/users';
import { User } from '../api/auth';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '../components/Skeleton';
import { cn } from '../lib/utils';
import axios from 'axios';

const editSchema = z.object({
  firstName: z.string().min(1, 'Requis'),
  lastName:  z.string().min(1, 'Requis'),
  email:     z.string().email('Email invalide'),
  role:      z.enum(['CLIENT', 'COACH', 'ADMIN']),
});

type EditFormData = z.infer<typeof editSchema>;

const roleBadge: Record<string, string> = {
  CLIENT: 'border-ink/15 text-muted',
  COACH:  'border-ink bg-ink text-paper',
  ADMIN:  'border-accent bg-accent text-white',
};

function TableRowSkeleton() {
  return (
    <tr className="border-b border-ink/8">
      <td className="px-5 py-4"><Skeleton className="h-3.5 w-32" /></td>
      <td className="px-5 py-4"><Skeleton className="h-3.5 w-44" /></td>
      <td className="px-5 py-4"><Skeleton className="h-3.5 w-16" /></td>
      <td className="px-5 py-4"><Skeleton className="h-3.5 w-24" /></td>
      <td className="px-5 py-4" />
    </tr>
  );
}

interface KPI { clients: number; coaches: number; admins: number }

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [kpi, setKpi] = useState<KPI | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [res, clientsRes, coachesRes, adminsRes] = await Promise.all([
        usersApi.list({ page, limit: 10 }),
        usersApi.list({ page: 1, limit: 1, role: 'CLIENT' }),
        usersApi.list({ page: 1, limit: 1, role: 'COACH' }),
        usersApi.list({ page: 1, limit: 1, role: 'ADMIN' }),
      ]);
      setUsers(res.data.data);
      setMeta(res.data.meta);
      setKpi({
        clients: clientsRes.data.meta.total,
        coaches: coachesRes.data.meta.total,
        admins:  adminsRes.data.meta.total,
      });
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const openEdit = (user: User) => {
    setEditingUser(user);
    reset({ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role });
  };

  const onSubmit = async (data: EditFormData) => {
    if (!editingUser) return;
    try {
      await usersApi.update(editingUser.id, data);
      toast.success('Utilisateur modifié');
      setEditingUser(null);
      void fetchUsers();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error((err.response?.data as { error?: { message?: string } })?.error?.message ?? 'Erreur');
      }
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await usersApi.delete(userId);
      toast.success('Utilisateur supprimé');
      void fetchUsers();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const plural = meta.total === 1 ? '' : 's';

  return (
    <div>
      <div className="mb-8 pb-6 border-b border-ink/8">
        <h1 className="font-serif italic text-[clamp(32px,4vw,48px)] text-ink leading-tight tracking-tight">
          Utilisateurs
        </h1>
        {!loading && (
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-1">
            {meta.total} utilisateur{plural}
          </p>
        )}
      </div>

      {kpi && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Clients',  value: kpi.clients, accent: false },
            { label: 'Coachs',   value: kpi.coaches, accent: false },
            { label: 'Admins',   value: kpi.admins,  accent: true  },
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
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Nom</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Email</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Rôle</th>
              <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">Inscrit le</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? (['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const).map((k) => <TableRowSkeleton key={k} />)
              : users.map((user) => (
                <tr key={user.id} className="border-b border-ink/8 hover:bg-ink/[0.02] transition-colors duration-100">
                  <td className="px-5 py-4 font-sans font-medium text-sm text-ink">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-5 py-4 font-sans text-sm text-muted">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className={cn('font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 border', roleBadge[user.role])}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-faint">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4 justify-end">
                      <button
                        onClick={() => openEdit(user)}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink hover:text-muted transition-colors duration-150"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => void handleDelete(user.id)}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent hover:opacity-70 transition-opacity"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />

      {editingUser && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-ink/15 w-full max-w-md shadow-[0_24px_64px_rgba(26,26,26,0.12)]">
            <div className="flex justify-between items-center px-7 py-5 border-b border-ink/8">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                Modifier l&apos;utilisateur
              </p>
              <button onClick={() => setEditingUser(null)} className="btn-ghost">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-7 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label htmlFor="u-first" className="input-label">Prénom</label>
                  <input {...register('firstName')} id="u-first" className="input-field" />
                  {errors.firstName && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label htmlFor="u-last" className="input-label">Nom</label>
                  <input {...register('lastName')} id="u-last" className="input-field" />
                  {errors.lastName && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="u-email" className="input-label">Email</label>
                <input {...register('email')} id="u-email" type="email" className="input-field" />
                {errors.email && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="u-role" className="input-label">Rôle</label>
                <select {...register('role')} id="u-role" className="input-field bg-transparent">
                  <option value="CLIENT">CLIENT</option>
                  <option value="COACH">COACH</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {errors.role && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.role.message}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? '…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
