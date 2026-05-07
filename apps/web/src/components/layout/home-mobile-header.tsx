'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { UserMenu } from '@/components/layout/user-menu';
import { cn } from '@/lib/utils';

export function HomeMobileHeader() {
  const { t } = useTranslation('nav');
  const { t: tSearch } = useTranslation('search');
  const router = useRouter();

  return (
    <div
      className={cn(
        'mb-2 flex min-h-touch items-center justify-between gap-2 lg:hidden',
        'pt-[max(0.25rem,env(safe-area-inset-top,0px))]',
      )}
    >
      <h1 className="min-w-0 flex-1 font-display text-h3 font-medium tracking-tight text-text-primary">
        {t('home')}
      </h1>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => router.push('/search')}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-brand-ui"
          aria-label={tSearch('open_aria')}
        >
          <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
        <UserMenu triggerVariant="avatar-only" />
      </div>
    </div>
  );
}
