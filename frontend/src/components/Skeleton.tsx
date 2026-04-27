import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

export function SessionCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-gray-700 to-gray-800" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="space-y-2 pt-1">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3.5 w-2/5" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg mt-2" />
      </div>
    </div>
  );
}
