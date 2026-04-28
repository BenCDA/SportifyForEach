import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-8">
      <div className="text-center">
        <p className="font-serif italic text-[clamp(96px,16vw,160px)] text-ink/[0.06] leading-none select-none mb-2">
          404
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
          Page introuvable
        </p>
        <div className="w-8 h-px bg-ink/20 mx-auto mb-8" />
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink hover:text-muted transition-colors duration-150"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Retour
        </Link>
      </div>
    </div>
  );
}
