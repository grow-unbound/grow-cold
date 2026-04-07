import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useSessionStore, type AppRole } from '@/stores/session-store';

function roleLabel(role: AppRole): string {
  switch (role) {
    case 'OWNER':
      return 'Owner';
    case 'MANAGER':
      return 'Manager';
    default:
      return 'Staff';
  }
}

export function UserMenu() {
  const { t } = useTranslation('menu');
  const { role, setRole } = useSessionStore();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" className="gap-1 px-3" type="button">
          <span className="sr-only">User menu</span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-800"
            aria-hidden
          >
            U
          </span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[12rem] rounded-md border border-slate-200 bg-white p-1 shadow-md"
          sideOffset={6}
          align="end"
        >
          <div className="px-2 py-1.5 text-xs text-slate-500">
            Role (dev): {roleLabel(role)}
          </div>
          <DropdownMenu.Item
            className="cursor-pointer rounded px-2 py-2 text-sm outline-none hover:bg-slate-100"
            onSelect={() => {}}
          >
            {t('settings')}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded px-2 py-2 text-sm outline-none hover:bg-slate-100"
            onSelect={() => {}}
          >
            {t('warehouse')}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded px-2 py-2 text-sm outline-none hover:bg-slate-100"
            onSelect={() => {}}
          >
            {t('profile')}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-slate-200" />
          <DropdownMenu.Item
            className="cursor-pointer rounded px-2 py-2 text-xs text-slate-500 outline-none hover:bg-slate-100"
            onSelect={() => setRole('STAFF')}
          >
            Simulate STAFF
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded px-2 py-2 text-xs text-slate-500 outline-none hover:bg-slate-100"
            onSelect={() => setRole('MANAGER')}
          >
            Simulate MANAGER
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded px-2 py-2 text-xs text-slate-500 outline-none hover:bg-slate-100"
            onSelect={() => setRole('OWNER')}
          >
            Simulate OWNER
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
