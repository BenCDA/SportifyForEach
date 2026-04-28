import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';
import { useState } from 'react';
import axios from 'axios';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await login(data.email, data.password);
      toast.success('Connexion réussie');
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setApiError(
          (err.response?.data as { error?: { message?: string } })?.error?.message ?? 'Erreur de connexion',
        );
      } else {
        setApiError('Une erreur est survenue');
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-paper">
      {/* Left — editorial panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-ink/8">
        <Link to="/" className="font-serif italic text-2xl text-ink">Sportify</Link>

        <div>
          <h1 className="font-serif italic text-[clamp(56px,6vw,80px)] text-ink leading-[0.95] tracking-tight mb-6">
            Le coaching sportif,<br />à votre rythme.
          </h1>
          <p className="font-sans text-sm text-muted max-w-xs leading-relaxed">
            Réservez des séances avec des coachs certifiés, suivez votre progression, progressez à votre rythme.
          </p>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
          Sportify · Coaching &amp; Performance
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <span className="font-serif italic text-2xl text-ink">Sportify</span>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted mb-8">
            Connexion
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            <div>
              <label htmlFor="login-email" className="input-label">Email</label>
              <input
                {...register('email')}
                id="login-email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="vous@exemple.com"
              />
              {errors.email && <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="input-label">Mot de passe</label>
              <input
                {...register('password')}
                id="login-password"
                type="password"
                autoComplete="current-password"
                className="input-field"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-accent">{errors.password.message}</p>}
            </div>

            <ErrorMessage message={apiError} />

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full gap-3">
              {isSubmitting ? 'Connexion…' : 'Connexion'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </form>

          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.1em] text-faint">
            Pas de compte ?{' '}
            <Link to="/register" className="text-ink underline underline-offset-4 hover:text-muted transition-colors">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
