'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useSessionStore } from '@/stores/session-store';

export function WarehouseGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      await hydrate(supabase);
      if (cancelled) return;

      const { count, error } = await supabase
        .from('user_warehouse_assignments')
        .select('warehouse_id', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      if (cancelled || error) return;

      const n = count ?? 0;
      if (n === 0 && !pathname.startsWith('/onboarding')) {
        router.replace('/onboarding/create-warehouse');
        return;
      }
      if (n > 0 && pathname.startsWith('/onboarding')) {
        router.replace('/');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, hydrate]);

  return <>{children}</>;
}
