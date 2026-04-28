import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';
import { SportSelect } from '../components/SportSelect';
import { useState } from 'react';
import { cn } from '../lib/utils';
import axios from 'axios';

const baseSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/\d/, 'Au moins un chiffre'),
  role: z.enum(['CLIENT', 'COACH']),
  specialties: z.array(z.string()).optional(),
  bio: z.string().optional(),
});

const schema = baseSchema.refine(
  (d) => d.role !== 'COACH' || (d.specialties && d.specialties.length > 0),
  { message: 'Au moins une spécialité requise', path: ['specialties'] },
);

type FormData = z.infer<typeof schema>;

export function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'COACH'>('CLIENT');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CLIENT', specialties: [] },
  });

  const specialties = watch('specialties') ?? [];

  const handleRoleChange = (r: 'CLIENT' | 'COACH') => {
    setRole(r);
    setValue('role', r);
  };

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await registerUser(data);
      toast.success('Compte créé');
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setApiError(
          (err.response?.data as { error?: { message?: string } })?.error?.message ??
            "Erreur lors de l'inscription",
        );
      } else {
        setApiError('Une erreur est survenue');
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 border-r border-ink/8">
        <Link to="/" className="font-serif italic text-2xl text-ink">Sportify</Link>

        <div>
          <h1 className="font-serif italic text-[clamp(48px,5vw,68px)] text-ink leading-[0.95] tracking-tight mb-6">
            Rejoignez<br />la communauté.
          </h1>
          <p className="font-sans text-sm text-muted max-w-xs leading-relaxed">
            Sportif ou coach, Sportify vous connecte avec ce dont vous avez besoin.
          </p>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
          Gratuit · Sans engagement
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-start justify-center p-8 bg-surface overflow-y-auto">
        <div className="w-full max-w-sm py-4">
          <div className="lg:hidden mb-10">
            <span className="font-serif italic text-2xl text-ink">Sportify</span>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted mb-8">
            Créer un compte
          </p>

          {/* Role toggle */}
          <div className="flex border border-ink/15 mb-8">
            {(['CLIENT', 'COACH'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={cn(
                  'flex-1 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-150',
                  role === r ? 'bg-ink text-paper' : 'text-muted hover:text-ink',
                )}
              >
                {r === 'CLIENT' ? 'Sportif' : 'Coach'}
              </button>
            ))}
          </div>
          <input type="hidden" {...register('role')} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="reg-firstName" className="input-label">Prénom</label>
                <input {...register('firstName')} id="reg-firstName" className="input-field" placeholder="Alice" />
                {errors.firstName && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="reg-lastName" className="input-label">Nom</label>
                <input {...register('lastName')} id="reg-lastName" className="input-field" placeholder="Dupont" />
                {errors.lastName && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="input-label">Email</label>
              <input {...register('email')} id="reg-email" type="email" className="input-field" placeholder="vous@exemple.com" />
              {errors.email && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="input-label">Mot de passe</label>
              <input {...register('password')} id="reg-password" type="password" className="input-field" placeholder="••••••••" />
              {errors.password && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.password.message}</p>}
            </div>

            {role === 'COACH' && (
              <>
                <div>
                  <p className="input-label">Spécialités <span className="text-accent normal-case">*</span> (max 3)</p>
                  <SportSelect
                    value={specialties}
                    onChange={(v) => setValue('specialties', v, { shouldValidate: true })}
                    error={errors.specialties?.message}
                  />
                </div>
                <div>
                  <label htmlFor="reg-bio" className="input-label">Biographie</label>
                  <textarea
                    {...register('bio')}
                    id="reg-bio"
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Expérience, certifications, approche…"
                  />
                </div>
              </>
            )}

            <ErrorMessage message={apiError} />

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full gap-3">
              {isSubmitting ? 'Création…' : 'Créer mon compte'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </form>

          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-ink underline underline-offset-4 hover:text-muted transition-colors">
              Connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
