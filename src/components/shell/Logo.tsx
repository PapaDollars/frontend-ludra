'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utilis/utils';
import logoWordmark from '@/assets/img/logo-wordmark.png';
import logoWordmarkLight from '@/assets/img/logo-wordmark-light.png';

type LogoVariant = 'default' | 'light';

/** Logo « LudraHome » de la V1 (Ludra #00117D + Home #FC6400). `light` : « Ludra » en blanc, pour les fonds sombres. */
export function LogoImage({ variant = 'default', className }: { variant?: LogoVariant; className?: string }) {
  return (
    <Image
      src={variant === 'light' ? logoWordmarkLight : logoWordmark}
      alt="LudraHome"
      priority
      className={cn('h-5 md:h-6 w-auto', className)}
    />
  );
}

export function Logo({ variant, className, imageClassName }: { variant?: LogoVariant; className?: string; imageClassName?: string }) {
  const { t } = useTranslation();
  return (
    <Link href="/" className={cn('flex items-center shrink-0', className)} aria-label={t('shell.top.home')}>
      <LogoImage variant={variant} className={imageClassName} />
    </Link>
  );
}
