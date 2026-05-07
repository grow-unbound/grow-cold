'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Building2, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useSelectedWarehouseName, useSessionStore, type WarehouseOption } from '@/stores/session-store';
import { cn } from '@/lib/utils';

export function DesktopWarehouseSwitcher() {
  const { t: tCommon } = useTranslation('common');
  const { t: tMenu } = useTranslation('menu');
  const router = useRouter();
  const warehouseName = useSelectedWarehouseName();
  const warehouses = useSessionStore((s) => s.warehouses);
  const selectedId = useSessionStore((s) => s.selectedWarehouseId);
  const setSelectedWarehouse = useSessionStore((s) => s.setSelectedWarehouse);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<WarehouseOption | null>(null);

  const label = warehouseName ?? tCommon('warehouse_placeholder');

  function requestSwitch(w: WarehouseOption) {
    if (w.id === selectedId) return;
    setPending(w);
    setConfirmOpen(true);
  }

  function confirmSwitch() {
    if (!pending) return;
    setSelectedWarehouse(pending.id);
    setPending(null);
    setConfirmOpen(false);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={cn(
              'flex max-w-[11rem] min-h-touch shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-left outline-none',
              'text-small font-medium text-text-secondary hover:bg-surface-inset/80 focus-visible:ring-2 focus-visible:ring-brand-ui',
            )}
            aria-label={tMenu('warehouse_switch_aria')}
          >
            <Building2 className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
            <span className="min-w-0 flex-1 truncate" title={label}>
              {label}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-[55] min-w-[12rem] rounded-base border border-border bg-white p-0.5 text-sm shadow-md"
            sideOffset={6}
            align="end"
          >
            {warehouses.length === 0 ? (
              <div className="px-2 py-2 text-caption text-text-tertiary">{tCommon('warehouse_placeholder')}</div>
            ) : (
              warehouses.map((w) => (
                <DropdownMenu.Item
                  key={w.id}
                  className={cn(
                    'flex cursor-pointer items-center rounded-base px-2 py-2 outline-none',
                    w.id === selectedId ? 'bg-brand-subtle text-brand-text' : 'hover:bg-surface-subtle',
                  )}
                  onSelect={(e) => {
                    e.preventDefault();
                    requestSwitch(w);
                  }}
                >
                  <Building2 className="mr-2 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
                  <span className="truncate">{w.warehouse_name}</span>
                </DropdownMenu.Item>
              ))
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tMenu('warehouse_switch_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tMenu('warehouse_switch_confirm_body', { name: pending?.warehouse_name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="secondary">
                {tMenu('warehouse_switch_cancel')}
              </Button>
            </AlertDialogCancel>
            <AlertDialogPrimitive.Action asChild>
              <Button type="button" variant="default" onClick={confirmSwitch}>
                {tMenu('warehouse_switch_confirm')}
              </Button>
            </AlertDialogPrimitive.Action>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
