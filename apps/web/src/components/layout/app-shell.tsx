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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">{t('app_name')}</h1>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-500 sm:inline">{role}</span>
          <UserMenu />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 pb-24">
        <Outlet />
      </main>
      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white"
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
            'flex min-h-12 flex-col items-center justify-center rounded-md px-1 text-center text-xs font-medium',
            isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800',
          )
        }
      >
        {t(props.i18nKey)}
      </NavLink>
    </li>
  );
}
