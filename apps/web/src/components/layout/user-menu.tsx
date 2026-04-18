'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
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
        <Button variant="outline" className="gap-0.5 px-2" type="button">
          <span className="sr-only">User menu</span>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-800"
            aria-hidden
          >
            U
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[11rem] rounded-base border border-neutral-200 bg-white p-0.5 text-sm shadow-md"
          sideOffset={6}
          align="end"
        >
          <div className="px-2 py-1 text-caption text-neutral-500">
            Role (dev): {roleLabel(role)}
          </div>
          <DropdownMenu.Item asChild>
            <Link
              href="/login"
              className="block cursor-pointer rounded-base px-2 py-1.5 text-sm text-primary-700 outline-none hover:bg-neutral-100"
            >
              {t('sign_in')}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded-base px-2 py-1.5 text-sm outline-none hover:bg-neutral-100"
            onSelect={() => {}}
          >
            {t('settings')}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded-base px-2 py-1.5 text-sm outline-none hover:bg-neutral-100"
            onSelect={() => {}}
          >
            {t('warehouse')}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded-base px-2 py-1.5 text-sm outline-none hover:bg-neutral-100"
            onSelect={() => {}}
          >
            {t('profile')}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-0.5 h-px bg-neutral-200" />
          <DropdownMenu.Item
            className="cursor-pointer rounded-base px-2 py-1.5 text-caption text-neutral-500 outline-none hover:bg-neutral-100"
            onSelect={() => setRole('STAFF')}
          >
            Simulate STAFF
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded-base px-2 py-1.5 text-caption text-neutral-500 outline-none hover:bg-neutral-100"
            onSelect={() => setRole('MANAGER')}
          >
            Simulate MANAGER
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded-base px-2 py-1.5 text-caption text-neutral-500 outline-none hover:bg-neutral-100"
            onSelect={() => setRole('OWNER')}
          >
            Simulate OWNER
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
