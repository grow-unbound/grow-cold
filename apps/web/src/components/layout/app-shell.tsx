'use client';

import type { LucideIcon } from 'lucide-react';
import { Home, Package, Receipt, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { UserMenu } from '@/components/layout/user-menu';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

type NavKey = 'home' | 'inventory' | 'parties' | 'receipts' | 'payments';

const tabs: {
  href: string;
  end?: boolean;
  i18nKey: NavKey;
  Icon: LucideIcon;
}[] = [
  { href: '/', end: true, i18nKey: 'home', Icon: Home },
  { href: '/inventory', i18nKey: 'inventory', Icon: Package },
  { href: '/parties', i18nKey: 'parties', Icon: Users },
  { href: '/receipts', i18nKey: 'receipts', Icon: Receipt },
  { href: '/payments', i18nKey: 'payments', Icon: Wallet },
];

function isTabActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const { role } = useSessionStore();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col bg-primary-50 lg:flex-row">
      {/* Desktop: left sidebar */}
      <aside
        className="hidden w-48 shrink-0 flex-col border-r border-neutral-200/80 bg-white lg:flex"
        aria-label="Main"
      >
        <div className="flex h-11 items-center border-b border-neutral-200/80 px-3">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">{t('app_name')}</span>
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
          <span className="truncate text-caption-sm text-neutral-500" title={role}>
            {role}
          </span>
          <UserMenu />
        </div>
      </aside>

      {/* Main column: header (mobile/tablet) + content */}
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <header className="flex w-full items-center justify-between border-b border-neutral-200/80 bg-white px-3 py-2 shadow-sm lg:hidden">
          <h1 className="text-sm font-semibold tracking-tight text-neutral-900">{t('app_name')}</h1>
          <div className="flex items-center gap-2">
            <span className="hidden text-caption-sm text-neutral-500 sm:inline">{role}</span>
            <UserMenu />
          </div>
        </header>

        <main className="page-container min-h-0 w-full max-w-none flex-1 self-stretch overflow-auto pb-14 pt-2 lg:pb-4 lg:pt-4">
          {children}
        </main>

        {/* Mobile & tablet: bottom tab bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200/80 bg-white/95 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm lg:hidden"
          aria-label="Main"
        >
          <ul className="flex w-full justify-between px-1 py-1">
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
          'flex min-h-touch flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-0.5 text-center',
          active
            ? 'bg-primary-50/90 text-primary-600'
            : 'text-neutral-500 hover:bg-neutral-50/80 hover:text-neutral-800',
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary-600' : 'text-neutral-400')} aria-hidden />
        <span className="text-caption font-medium leading-tight">{t(props.i18nKey)}</span>
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
        'flex min-h-touch items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200'
          : 'text-neutral-600 hover:bg-neutral-50',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary-600' : 'text-neutral-400')} aria-hidden />
      <span className="truncate">{t(props.i18nKey)}</span>
    </Link>
  );
}
