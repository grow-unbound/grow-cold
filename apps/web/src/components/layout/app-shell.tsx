import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserMenu } from '@/components/layout/user-menu';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', end: true, i18nKey: 'home' as const },
  { to: '/inventory', i18nKey: 'inventory' as const },
  { to: '/parties', i18nKey: 'parties' as const },
  { to: '/receipts', i18nKey: 'receipts' as const },
  { to: '/payments', i18nKey: 'payments' as const },
];

export function AppShell() {
  const { t } = useTranslation('common');
  const { role } = useSessionStore();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-neutral-900">{t('app_name')}</h1>
        <div className="flex items-center gap-2">
          <span className="hidden text-label text-neutral-500 sm:inline">{role}</span>
          <UserMenu />
        </div>
      </header>
      <main className="page-container flex-1 overflow-auto pb-24 pt-4">
        <Outlet />
      </main>
      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white"
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-lg justify-between px-1 py-2">
          {tabs.map((tab) => (
            <TabLink key={tab.to} to={tab.to} end={tab.end} i18nKey={tab.i18nKey} />
          ))}
        </ul>
      </nav>
    </div>
  );
}

function TabLink(props: {
  to: string;
  end?: boolean;
  i18nKey: 'home' | 'inventory' | 'parties' | 'receipts' | 'payments';
}) {
  const { t } = useTranslation('nav');
  return (
    <li className="flex-1">
      <NavLink
        to={props.to}
        end={props.end}
        className={({ isActive }) =>
          cn(
            'flex min-h-touch flex-col items-center justify-center rounded-base px-1 pb-0.5 text-center text-label font-medium',
            isActive
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-neutral-500 hover:text-neutral-800',
          )
        }
      >
        {t(props.i18nKey)}
      </NavLink>
    </li>
  );
}
