import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Users } from 'lucide-react';
import { usersApi } from '../api/users';
import { User } from '../api/auth';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '../components/Skeleton';
import { cn } from '../lib/utils';
import axios from 'axios';

const editSchema = z.object({
  firstName: z.string().min(1, 'Requis'),
  lastName: z.string().min(1, 'Requis'),
  email: z.string().email('Email invalide'),
  role: z.enum(['CLIENT', 'COACH', 'ADMIN']),
});

type EditFormData = z.infer<typeof editSchema>;

const roleBadge: Record<string, string> = {
  CLIENT: 'badge-client',
  COACH: 'badge-coach',
  ADMIN: 'badge-admin',
};

function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-44" /></td>
      <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
      <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
    </tr>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page, limit: 10 });
      setUsers(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

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
        toast.error(err.response?.data?.error?.message as string ?? 'Erreur');
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Gestion des utilisateurs</h1>
        {loading ? null : (
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />{meta.total} utilisateur{meta.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inscrit le</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading
                ? ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'].map((k) => <TableRowSkeleton key={k} />)
                : users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/40 transition-colors duration-150">
                    <td className="px-6 py-4 font-medium text-gray-100">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn('badge', roleBadge[user.role])}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => openEdit(user)}
                          className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
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
      </div>

      <Pagination page={page} total={meta.total} limit={meta.limit} onPageChange={setPage} />

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-gray-100">Modifier l&apos;utilisateur</h2>
              <button onClick={() => setEditingUser(null)} className="btn-ghost p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="u-first" className="block text-sm font-medium text-gray-300 mb-1.5">Prénom</label>
                  <input {...register('firstName')} id="u-first" className="input-field" />
                  {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label htmlFor="u-last" className="block text-sm font-medium text-gray-300 mb-1.5">Nom</label>
                  <input {...register('lastName')} id="u-last" className="input-field" />
                  {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="u-email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <input {...register('email')} id="u-email" type="email" className="input-field" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="u-role" className="block text-sm font-medium text-gray-300 mb-1.5">Rôle</label>
                <select {...register('role')} id="u-role" className="input-field">
                  <option value="CLIENT">CLIENT</option>
                  <option value="COACH">COACH</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? '...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
