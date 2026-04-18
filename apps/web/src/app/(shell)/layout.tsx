import { AppShell } from '@/components/layout/app-shell';
import { WarehouseGate } from '@/components/layout/warehouse-gate';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <WarehouseGate>
      <AppShell>{children}</AppShell>
    </WarehouseGate>
  );
}
