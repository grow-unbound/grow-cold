'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, Home, Package, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { UserMenu } from '@/components/layout/user-menu';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useSelectedWarehouseName, useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

type NavKey = 'home' | 'inventory' | 'parties' | 'transactions';

const tabs: {
  href: string;
  end?: boolean;
  i18nKey: NavKey;
  Icon: LucideIcon;
}[] = [
  { href: '/', end: true, i18nKey: 'home', Icon: Home },
  { href: '/inventory', i18nKey: 'inventory', Icon: Package },
  { href: '/parties', i18nKey: 'parties', Icon: Users },
  { href: '/transactions', i18nKey: 'transactions', Icon: ArrowLeftRight },
];

function isTabActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const pathname = usePathname();
  const warehouseName = useSelectedWarehouseName();
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void hydrate(supabase);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void hydrate(supabase);
    });
    return () => subscription.unsubscribe();
  }, [pathname, hydrate]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-neutral-50 lg:flex-row">
      {/* Desktop: left sidebar — brand accent strip (color only, no third-party mark) */}
      <aside
        className="hidden w-48 shrink-0 flex-col border-r border-neutral-200/80 bg-white lg:flex"
        aria-label="Main"
      >
        <div className="h-1 w-full shrink-0 bg-primary-500" aria-hidden />
        <div className="flex min-h-touch flex-col justify-center border-b border-neutral-200/80 px-3 py-2">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">{t('app_name')}</span>
          {warehouseName ? (
            <span className="mt-0.5 truncate text-caption text-neutral-500" title={warehouseName}>
              {warehouseName}
            </span>
          ) : (
            <span className="mt-0.5 truncate text-caption text-neutral-400">{t('warehouse_placeholder')}</span>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-1.5">
          {tabs.map((tab) => (
            <SidebarNavLink
              key={tab.href}
              href={tab.href}
              end={tab.end}
              pathname={pathname}
              i18nKey={tab.i18nKey}
              Icon={tab.Icon}
            />
          ))}
        </nav>
        <div className="flex flex-col gap-1.5 border-t border-neutral-200/80 p-2">
          <UserMenu />
        </div>
      </aside>

      {/* Main column: header (mobile/tablet) + content */}
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <header className="z-10 flex w-full flex-col border-b border-neutral-200/80 bg-white shadow-sm lg:hidden">
          <div className="h-0.5 w-full bg-primary-500" aria-hidden />
          <div className="flex min-h-touch items-center justify-between gap-2 px-3 py-0 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold tracking-tight text-neutral-900">{t('app_name')}</h1>
              {warehouseName ? (
                <p className="truncate text-caption text-neutral-500" title={warehouseName}>
                  {warehouseName}
                </p>
              ) : (
                <p className="truncate text-caption text-neutral-400">{t('warehouse_placeholder')}</p>
              )}
            </div>
            <UserMenu />
          </div>
        </header>

        <main className="page-container min-h-0 w-full max-w-none flex-1 self-stretch overflow-auto pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-2 lg:pb-4 lg:pt-4">
          {children}
        </main>

        {/* Mobile & tablet: bottom tab bar (super-app: green active, safe area) */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200/80 bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_16px_rgba(0,0,0,0.05)] backdrop-blur-md lg:hidden"
          aria-label="Main"
        >
          <ul className="flex w-full justify-between px-1.5 py-1.5">
            {tabs.map((tab) => (
              <BottomTabLink
                key={tab.href}
                href={tab.href}
                end={tab.end}
                pathname={pathname}
                i18nKey={tab.i18nKey}
                Icon={tab.Icon}
              />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function BottomTabLink(props: {
  href: string;
  end?: boolean;
  pathname: string;
  i18nKey: NavKey;
  Icon: LucideIcon;
}) {
  const { t } = useTranslation('nav');
  const active = isTabActive(props.pathname, props.href, props.end);
  const Icon = props.Icon;
  return (
    <li className="min-w-0 flex-1">
      <Link
        href={props.href}
        className={cn(
          'flex min-h-touch flex-col items-center justify-center gap-1 rounded-full px-1.5 py-1 text-center transition-colors',
          active
            ? 'bg-primary-100 text-primary-700'
            : 'text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-800',
        )}
      >
        <Icon
          className={cn('h-5 w-5 shrink-0', active ? 'text-primary-600' : 'text-neutral-400')}
          strokeWidth={active ? 2.25 : 1.75}
          aria-hidden
        />
        <span
          className={cn(
            'text-caption font-semibold leading-tight',
            active ? 'text-primary-800' : 'text-neutral-500',
          )}
        >
          {t(props.i18nKey)}
        </span>
      </Link>
    </li>
  );
}

function SidebarNavLink(props: {
  href: string;
  end?: boolean;
  pathname: string;
  i18nKey: NavKey;
  Icon: LucideIcon;
}) {
  const { t } = useTranslation('nav');
  const active = isTabActive(props.pathname, props.href, props.end);
  const Icon = props.Icon;
  return (
    <Link
      href={props.href}
      className={cn(
        'flex min-h-touch items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors',
        active
          ? 'bg-primary-50 text-primary-800 ring-1 ring-inset ring-primary-200/80'
          : 'text-neutral-600 hover:bg-neutral-50',
      )}
    >
      <Icon
        className={cn('h-5 w-5 shrink-0', active ? 'text-primary-600' : 'text-neutral-400')}
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden
      />
      <span className="truncate">{t(props.i18nKey)}</span>
    </Link>
  );
}
