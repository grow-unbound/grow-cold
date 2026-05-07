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
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user || cancelled) return;

      await hydrate(supabase);
      if (cancelled) return;

      const n = useSessionStore.getState().warehouses.length;
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
