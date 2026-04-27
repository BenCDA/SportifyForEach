import { Link } from 'react-router-dom';
import { Dumbbell, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Dumbbell className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-6xl font-extrabold text-gray-700 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">Page introuvable</h2>
        <p className="text-gray-500 text-sm mb-8">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 btn-primary">
          <ArrowLeft className="w-4 h-4" />Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
