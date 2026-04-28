import { cn } from '../lib/utils';

interface AvatarUser {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

const sizeMap = {
  sm:  'w-8 h-8 text-[10px]',
  md:  'w-12 h-12 text-xs',
  lg:  'w-24 h-24 text-2xl',
  xl:  'w-40 h-40 text-4xl',
} as const;

interface AvatarProps {
  user: AvatarUser;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function Avatar({ user, size = 'md', className }: Readonly<AvatarProps>) {
  const initials = `${user.firstName[0] ?? '?'}${user.lastName[0] ?? ''}`.toUpperCase();
  const baseClass = cn(
    'shrink-0 rounded-sm border border-ink/8 object-cover',
    sizeMap[size],
    className,
  );

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={`${user.firstName} ${user.lastName}`}
        className={baseClass}
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center font-mono font-medium uppercase tracking-wide bg-accent text-white rounded-sm border border-ink/8',
        sizeMap[size],
        className,
      )}
      aria-label={`${user.firstName} ${user.lastName}`}
    >
      {initials}
    </div>
  );
}
