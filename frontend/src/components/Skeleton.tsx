import { cn } from '../lib/utils';

interface SkeletonProps { className?: string }

export function Skeleton({ className }: Readonly<SkeletonProps>) {
  return <div className={cn('shimmer-line h-4', className)} />;
}

export function SessionCardSkeleton() {
  return (
    <div className="bg-surface border border-ink/10 p-5 space-y-3">
      <div className="shimmer-line h-5 w-3/4" />
      <div className="shimmer-line h-3 w-1/2" />
      <div className="shimmer-line h-3 w-2/5" />
      <div className="shimmer-line h-3 w-1/3" />
      <div className="pt-2">
        <div className="shimmer-line h-10 w-full" />
      </div>
    </div>
  );
}

export function SessionRowSkeleton() {
  return (
    <div className="flex items-center gap-6 px-4 py-4 border-b border-ink/8">
      <div className="shimmer-line h-4 flex-1" />
      <div className="shimmer-line h-4 w-32 hidden md:block" />
      <div className="shimmer-line h-4 w-40 hidden md:block" />
      <div className="shimmer-line h-4 w-12 hidden md:block" />
      <div className="shimmer-line h-8 w-24" />
    </div>
  );
}

export function LoadingText() {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-faint animate-pulse py-12 text-center">
      Chargement
    </p>
  );
}
