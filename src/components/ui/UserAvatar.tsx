'use client';

import { useState } from 'react';
import { cn } from '@/utilis/utils';
import { initials } from '@/utilis/format';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
} as const;

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Avatar rond : photo si disponible, sinon initiales sur fond bleu clair (charte V2.1). */
export function UserAvatar({ name, src, size = 'md', className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const base = cn('shrink-0 rounded-full overflow-hidden flex items-center justify-center font-semibold', SIZES[size], className);

  if (src && !failed) {
    return <img src={src} alt={name} className={cn(base, 'object-cover')} onError={() => setFailed(true)} />;
  }
  return (
    <span className={cn(base, 'bg-brand-50 text-brand-700')} aria-hidden="true">
      {initials(name) || '?'}
    </span>
  );
}
