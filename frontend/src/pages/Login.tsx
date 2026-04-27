import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dumbbell, Mail, Lock } from 'lucide-react';
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
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setApiError(err.response?.data?.error?.message as string ?? 'Erreur de connexion');
      } else {
        setApiError('Une erreur est survenue');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-900 via-[#0D1220] to-[#0B0F19] flex-col items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-600 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/30">
            <Dumbbell className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Sportify Pro</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            La plateforme de coaching sportif qui connecte coaches et athlètes.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['🏋️', 'Séances'], ['📅', 'Planning'], ['🎯', 'Objectifs']].map(([icon, label]) => (
              <div key={label} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs text-gray-400 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0B0F19]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-100">Sportify Pro</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-100">Connexion</h2>
            <p className="text-gray-500 mt-1">Bon retour parmi nous !</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  {...register('email')}
                  id="login-email"
                  type="email"
                  placeholder="email@exemple.com"
                  className="input-field pl-9"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  {...register('password')}
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  className="input-field pl-9"
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <ErrorMessage message={apiError} />

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 mt-2">
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover font-medium transition-colors">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
