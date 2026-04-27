import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dumbbell, Mail, Lock, User, Briefcase, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';
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
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

const schema = baseSchema.refine(
  (d) => d.role !== 'COACH' || (d.specialty && d.specialty.length > 0),
  { message: 'Spécialité requise pour un compte coach', path: ['specialty'] },
);

type FormData = z.infer<typeof schema>;

export function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'COACH'>('CLIENT');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'CLIENT' },
  });

  const handleRoleChange = (r: 'CLIENT' | 'COACH') => {
    setRole(r);
    setValue('role', r);
  };

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await registerUser(data);
      toast.success('Compte créé avec succès !');
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setApiError(err.response?.data?.error?.message as string ?? 'Erreur lors de l\'inscription');
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
          <div className="absolute top-20 right-20 w-64 h-64 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-orange-600 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/30">
            <Dumbbell className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Rejoignez-nous</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Créez votre compte et commencez votre parcours sportif dès aujourd&apos;hui.
          </p>
          <div className="mt-10 space-y-3 text-left">
            {[
              ['🏃', 'Réservez vos séances en ligne'],
              ['📊', 'Suivez vos performances'],
              ['🤝', 'Connectez-vous avec des coachs certifiés'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 bg-gray-800/40 rounded-xl px-4 py-3 border border-gray-700/40">
                <span className="text-xl">{icon}</span>
                <span className="text-sm text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0B0F19] overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl text-gray-100">Sportify Pro</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-100">Créer un compte</h2>
            <p className="text-gray-500 mt-1">C&apos;est rapide et gratuit.</p>
          </div>

          {/* Role toggle */}
          <div className="flex gap-2 p-1 bg-gray-800/60 rounded-xl border border-gray-700 mb-6">
            {(['CLIENT', 'COACH'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={cn(
                  'flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
                  role === r
                    ? 'bg-accent text-white shadow-md'
                    : 'text-gray-400 hover:text-gray-200',
                )}
              >
                {r === 'CLIENT' ? '🏃 Sportif' : '🎯 Coach'}
              </button>
            ))}
          </div>
          <input type="hidden" {...register('role')} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-firstName" className="block text-sm font-medium text-gray-300 mb-1.5">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input {...register('firstName')} id="reg-firstName" className="input-field pl-9" placeholder="Alice" />
                </div>
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label htmlFor="reg-lastName" className="block text-sm font-medium text-gray-300 mb-1.5">Nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input {...register('lastName')} id="reg-lastName" className="input-field pl-9" placeholder="Dupont" />
                </div>
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input {...register('email')} id="reg-email" type="email" className="input-field pl-9" placeholder="email@exemple.com" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input {...register('password')} id="reg-password" type="password" className="input-field pl-9" placeholder="••••••••" />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {role === 'COACH' && (
              <>
                <div>
                  <label htmlFor="reg-specialty" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Spécialité <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input {...register('specialty')} id="reg-specialty" className="input-field pl-9" placeholder="Ex: Yoga, CrossFit, Boxe..." />
                  </div>
                  {errors.specialty && <p className="text-red-400 text-xs mt-1">{errors.specialty.message}</p>}
                </div>
                <div>
                  <label htmlFor="reg-bio" className="block text-sm font-medium text-gray-300 mb-1.5">Biographie</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <textarea
                      {...register('bio')}
                      id="reg-bio"
                      className="input-field pl-9 resize-none"
                      rows={3}
                      placeholder="Parlez de votre expérience, certifications..."
                    />
                  </div>
                </div>
              </>
            )}

            <ErrorMessage message={apiError} />

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 mt-1">
              {isSubmitting ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
