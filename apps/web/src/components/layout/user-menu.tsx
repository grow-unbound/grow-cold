'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Building2, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useSessionStore, type AppRole, type WarehouseOption } from '@/stores/session-store';

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

function initials(displayName: string | null): string {
  if (!displayName?.trim()) return 'U';
  const parts = displayName.trim().split(/\s+/);
  const a = parts[0]?.[0];
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return ((a ?? '') + (b ?? '')).toUpperCase().slice(0, 2) || 'U';
}

function WarehousePicker({
  warehouses,
  selectedId,
  onSelect,
}: {
  warehouses: WarehouseOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation('menu');
  const n = warehouses.length;
  const selected = warehouses.find((w) => w.id === selectedId) ?? warehouses[0];
  const name = selected?.warehouse_name ?? '—';

  if (n <= 1) {
    return (
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
          <span className="truncate text-caption text-neutral-800">{name}</span>
        </div>
        <Switch checked={false} onCheckedChange={() => {}} disabled aria-label={t('warehouse_switch_aria')} />
      </div>
    );
  }

  if (n === 2) {
    const [a, b] = warehouses;
    const isSecond = selectedId === b.id;
    return (
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
          <span className="truncate text-caption text-neutral-800">{name}</span>
        </div>
        <Switch
          checked={isSecond}
          onCheckedChange={(on) => onSelect(on ? b.id : a.id)}
          aria-label={t('warehouse_switch_aria')}
        />
      </div>
    );
  }

  return (
      <div className="flex flex-col gap-2 px-2 py-1.5">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
        <span className="text-label-lg font-semibold text-neutral-700">{t('warehouse')}</span>
      </div>
      <select
        className="input-base"
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        aria-label={t('warehouse_select_aria')}
      >
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.warehouse_name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function UserMenu() {
  const { t } = useTranslation('menu');
  const router = useRouter();
  const {
    role,
    displayName,
    phone,
    tenantName,
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouse,
    clearSession,
  } = useSessionStore();

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient();
    try {
      await supabase.auth.signOut();
    } finally {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      } catch {
        /* ignore — client signOut already ran */
      }
      clearSession();
      router.replace('/login');
      router.refresh();
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="secondary"
          className="min-h-touch gap-0.5 rounded-full border-neutral-200 px-2.5 py-0"
          type="button"
        >
          <span className="sr-only">{t('user_menu')}</span>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-caption font-semibold text-neutral-800"
            aria-hidden
          >
            {initials(displayName)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[14rem] rounded-base border border-neutral-200 bg-white p-0.5 text-sm shadow-md"
          sideOffset={6}
          align="end"
        >
          <div className="border-b border-neutral-100 px-2 py-2">
            <p className="truncate text-sm font-semibold text-neutral-900">{displayName ?? t('unknown_user')}</p>
            <p className="mt-0.5 truncate text-caption text-neutral-600">{phone ?? '—'}</p>
            <p className="mt-1 truncate text-caption text-neutral-600">
              <span className="font-medium text-neutral-700">{roleLabel(role)}</span>
              {tenantName ? (
                <>
                  <span className="text-neutral-400"> · </span>
                  <span>{tenantName}</span>
                </>
              ) : null}
            </p>
          </div>

          <WarehousePicker
            warehouses={warehouses}
            selectedId={selectedWarehouseId}
            onSelect={(id) => {
              setSelectedWarehouse(id);
              router.refresh();
            }}
          />

          <DropdownMenu.Separator className="my-0.5 h-px bg-neutral-200" />

          <DropdownMenu.Item asChild>
            <Link
              href="/settings"
              className="flex cursor-pointer items-center gap-2 rounded-base px-2 py-1.5 text-sm text-neutral-800 outline-none hover:bg-neutral-100"
            >
              <Settings className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              {t('settings')}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link
              href="/profile"
              className="flex cursor-pointer items-center gap-2 rounded-base px-2 py-1.5 text-sm text-neutral-800 outline-none hover:bg-neutral-100"
            >
              <User className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              {t('profile')}
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-0.5 h-px bg-neutral-200" />

          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 rounded-base px-2 py-1.5 text-sm text-neutral-800 outline-none hover:bg-neutral-100"
            onSelect={(e) => {
              e.preventDefault();
              void signOut();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
            {t('logout')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
