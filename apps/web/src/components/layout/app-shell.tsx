'use client';

import type { LucideIcon } from 'lucide-react';
import { Home, IndianRupee, Package, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DesktopInlineSearch } from '@/components/layout/desktop-inline-search';
import { DesktopWarehouseSwitcher } from '@/components/layout/desktop-warehouse-switcher';
import { UserMenu } from '@/components/layout/user-menu';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

type NavKey = 'home' | 'stock' | 'parties' | 'money';

const tabs: {
  href: string;
  end?: boolean;
  i18nKey: NavKey;
  Icon: LucideIcon;
}[] = [
  { href: '/', end: true, i18nKey: 'home', Icon: Home },
  { href: '/inventory', i18nKey: 'stock', Icon: Package },
  { href: '/parties', i18nKey: 'parties', Icon: Users },
  { href: '/transactions', i18nKey: 'money', Icon: IndianRupee },
];

const HOME_TAB = { href: '/', end: true, i18nKey: 'home' as NavKey, Icon: Home };

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { href: '/inventory', end: false, i18nKey: 'stock' as NavKey, Icon: Package },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/parties', end: false, i18nKey: 'parties' as NavKey, Icon: Users },
      { href: '/transactions', end: false, i18nKey: 'money' as NavKey, Icon: IndianRupee },
    ],
  },
];

function isTabActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NetworkBadge() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return online ? (
    <span className="badge-inward flex items-center gap-1.5 text-small">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-inward" aria-hidden />
      Online
    </span>
  ) : (
    <span className="badge-pending flex items-center gap-1.5 text-small">
      ⚡ Offline
    </span>
  );
}

function DesktopTopBar() {
  return (
    <header className="sticky top-0 z-20 hidden h-[52px] w-full shrink-0 border-b border-border bg-surface lg:flex">
      <div className="flex min-h-[52px] w-full min-w-0 items-center justify-end gap-3 px-4">
        <NetworkBadge />
        <DesktopInlineSearch />
        <DesktopWarehouseSwitcher />
        <UserMenu triggerVariant="avatar-only" />
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrate = useSessionStore((s) => s.hydrate);
  const hideMobileTabBar = pathname === '/search';

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
    <div className="flex min-h-screen w-full flex-col bg-surface-subtle lg:h-[100dvh] lg:max-h-[100dvh] lg:flex-row lg:overflow-hidden">
      <aside
        className="hidden w-[200px] shrink-0 flex-col border-r border-border/80 bg-surface-subtle lg:flex lg:h-full lg:max-h-full lg:overflow-y-auto"
        aria-label="Main"
      >
        <div className="h-1 w-full shrink-0 bg-brand-ui" aria-hidden />
        <div className="flex min-h-touch flex-col justify-center border-b border-border/80 px-4 py-3">
          <AppShellWordmark />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-1.5">
          <AppShellNav pathname={pathname} />
        </nav>
      </aside>

      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0">
        <DesktopTopBar />

        <main className="page-container min-h-0 w-full max-w-none flex-1 self-stretch overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] pt-2 lg:pb-4 lg:pt-4">
          {children}
        </main>

        <nav
          className={cn(
            'fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-white/95 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_16px_rgba(0,0,0,0.05)] backdrop-blur-md lg:hidden',
            hideMobileTabBar && 'hidden',
          )}
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

function AppShellWordmark() {
  const { t } = useTranslation('common');
  return (
    <span className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-text-primary">
      <span className="relative inline-flex h-3.5 w-3.5 shrink-0 rounded-full bg-brand-ui" aria-hidden>
        <span className="absolute inset-[3px] rounded-full bg-white" />
      </span>
      {t('app_name')}
    </span>
  );
}

function AppShellNav(props: { pathname: string }) {
  return (
    <>
      <SidebarNavLink
        key={HOME_TAB.href}
        href={HOME_TAB.href}
        end={HOME_TAB.end}
        pathname={props.pathname}
        i18nKey={HOME_TAB.i18nKey}
        Icon={HOME_TAB.Icon}
      />
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mt-2">
          <span className="type-label px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {group.label}
          </span>
          {group.items.map((item) => (
            <SidebarNavLink
              key={item.href}
              href={item.href}
              end={item.end}
              pathname={props.pathname}
              i18nKey={item.i18nKey}
              Icon={item.Icon}
            />
          ))}
        </div>
      ))}
    </>
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
          'flex min-h-touch flex-col items-center justify-center gap-1 px-1.5 py-1 text-center transition-colors',
          active ? 'text-brand-ui' : 'text-text-tertiary hover:text-text-primary',
        )}
      >
        <Icon
          className={cn('h-5 w-5 shrink-0', active ? 'text-brand-ui' : 'text-text-tertiary')}
          strokeWidth={active ? 2.25 : 1.75}
          aria-hidden
        />
        <span
          className={cn(
            'text-caption font-semibold leading-tight',
            active ? 'text-brand-ui' : 'text-text-tertiary',
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
        'flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors',
        active
          ? 'bg-brand-ui font-semibold text-white'
          : 'font-medium text-text-secondary hover:bg-surface-subtle',
      )}
    >
      <Icon
        className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-text-tertiary')}
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden
      />
      <span className="truncate">{t(props.i18nKey)}</span>
    </Link>
  );
}
